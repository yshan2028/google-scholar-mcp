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

    // to support multiple simultaneous connections
    transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

    private toolInterval: NodeJS.Timeout | undefined;

    constructor(server: Server) {
        this.server = server;
        this.setupTools();
    }

    async handleGetRequest(req: Request, res: Response) {
        // if server does not offer an SSE stream at this endpoint.
        // res.status(405).set('Allow', 'POST').send('Method Not Allowed')
        console.log("Received GET request");

        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !this.transports[sessionId]) {
            res
                .status(400)
                .json(
                    this.createErrorResponse("Bad Request: invalid session ID or method.")
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
        let transport: StreamableHTTPServerTransport;

        console.log('Executing request for with sessionId:', sessionId);

        try {
            // reuse existing transport
            if (sessionId && this.transports[sessionId]) {
                transport = this.transports[sessionId];
                await transport.handleRequest(req, res, req.body);
                return;
            }

            // create new transport
            if (!sessionId && this.isInitializeRequest(req.body)) {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                });

                await this.server.connect(transport);
                await transport.handleRequest(req, res, req.body);

                // session ID will only be available (if in not Stateless-Mode)
                // after handling the first request
                const sessionId = transport.sessionId;
                if (sessionId) {
                    this.transports[sessionId] = transport;
                }
                return;
            }
            res.status(400).json(
                this.createErrorResponse("Bad Request: invalid session ID or method.")
            );
        } catch (error) {
            console.error("Error handling MCP request:", error);
            res.status(500).json(this.createErrorResponse("Internal server error."));
        }
    }

    async cleanup() {
        this.toolInterval?.close();
        await this.server.close();
    }

    private setupTools() {
        // Define available tools
        const setToolSchema = () =>
            this.server.setRequestHandler(ListToolsRequestSchema, async () => {
                return {
                    tools: googleScholarTools,
                };
            });

        setToolSchema();

        // handle tool calls
        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request, extra) => {
                const args = request.params.arguments;
                const toolName = request.params.name;
                console.log("Received request for tool with argument:", toolName, args);

                if (!args) {
                    throw new Error("arguments undefined");
                }

                if (!toolName) {
                    throw new Error("tool name undefined");
                }

                /* Handle tool call here */

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

    // send message streaming message every second
    private async streamMessages(transport: StreamableHTTPServerTransport) {
        try {
            // based on LoggingMessageNotificationSchema to trigger setNotificationHandler on client
            const message: LoggingMessageNotification = {
                method: "notifications/message",
                params: { level: "info", data: "SSE Connection established" },
            };

            this.sendNotification(transport, message);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }

    private async sendNotification(
        transport: StreamableHTTPServerTransport,
        notification: Notification
    ) {
        const rpcNotificaiton: JSONRPCNotification = {
            ...notification,
            jsonrpc: JSON_RPC,
        };
        await transport.send(rpcNotificaiton);
    }

    private createErrorResponse(message: string): JSONRPCError {
        return {
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: message,
            },
            id: randomUUID(),
        };
    }

    private isInitializeRequest(body: any): boolean {
        const isInitial = (data: any) => {
            const result = InitializeRequestSchema.safeParse(data);
            return result.success;
        };
        if (Array.isArray(body)) {
            return body.some((request) => isInitial(request));
        }
        return isInitial(body);
    }
}