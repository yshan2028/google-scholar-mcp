import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
    Notification,
    CallToolRequestSchema,
    ListToolsRequestSchema,
    LoggingMessageNotification,
    JSONRPCNotification,
    JSONRPCError,
    InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { callSearchScholarTool, callSearchAuthorProfilesTool, callGetAuthorDetailTool, callGetArticleCitationTool, googleScholarTools } from "./tools.js";

const SESSION_ID_HEADER_NAME = "mcp-session-id";
const JSON_RPC = "2.0";

export class MCPServer {
    server: Server;

    transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

    constructor(server: Server) {
        this.server = server;
        this.setupTools();
    }

    async handleGetRequest(req: Request, res: Response) {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !this.transports[sessionId]) {
            res.status(400).json(
                this.createErrorResponse(null, "Bad Request: invalid session ID or method.")
            );
            return;
        }

        console.log(`Establishing SSE stream for session ${sessionId}`);
        const transport = this.transports[sessionId];
        await transport.handleRequest(req, res);
        await this.streamMessages(transport);
    }

    async handlePostRequest(req: Request, res: Response) {
        const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;

        console.log('Executing request with sessionId:', sessionId);

        try {
            if (sessionId && this.transports[sessionId]) {
                const transport = this.transports[sessionId];
                await transport.handleRequest(req, res, req.body);
                return;
            }

            if (!sessionId && this.isInitializeRequest(req.body)) {
                const newTransport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                });

                await this.server.connect(newTransport);
                await newTransport.handleRequest(req, res, req.body);

                const newSessionId = newTransport.sessionId;
                if (newSessionId) {
                    this.transports[newSessionId] = newTransport;
                }
                return;
            }

            res.status(400).json(
                this.createErrorResponse(req.body?.id ?? null, "Bad Request: invalid session ID or method.")
            );
        } catch (error) {
            console.error("Error handling MCP request:", error);
            res.status(500).json(
                this.createErrorResponse(req.body?.id ?? null, "Internal server error.")
            );
        }
    }

    async cleanup() {
        await this.server.close();
    }

    private setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return { tools: googleScholarTools };
        });

        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request) => {
                const args = request.params.arguments;
                const toolName = request.params.name;
                console.log("Received request for tool:", toolName, args);

                if (!args) throw new Error("arguments undefined");
                if (!toolName) throw new Error("tool name undefined");

                switch (toolName) {
                    case 'search_google_scholar':
                        return await callSearchScholarTool(args);
                    case 'search_author_profiles':
                        return await callSearchAuthorProfilesTool(args);
                    case 'get_author_detail':
                        return await callGetAuthorDetailTool(args);
                    case 'get_article_citation':
                        return await callGetArticleCitationTool(args);
                    default:
                        throw new Error(`Unknown tool: ${toolName}`);
                }
            }
        );
    }

    private async streamMessages(transport: StreamableHTTPServerTransport) {
        try {
            const notification: LoggingMessageNotification = {
                method: "notifications/message",
                params: { level: "info", data: "SSE Connection established" },
            };
            const rpcNotification: JSONRPCNotification = {
                ...notification,
                jsonrpc: JSON_RPC,
            };
            await transport.send(rpcNotification);
        } catch (error) {
            console.error("Error sending SSE notification:", error);
        }
    }

    private createErrorResponse(id: string | number | null, message: string): JSONRPCError {
        return {
            jsonrpc: "2.0",
            error: { code: -32000, message },
            id: id ?? -1,
        };
    }

    private isInitializeRequest(body: any): boolean {
        const check = (data: any) => InitializeRequestSchema.safeParse(data).success;
        if (Array.isArray(body)) return body.some(check);
        return check(body);
    }
}
