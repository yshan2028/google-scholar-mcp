import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import readline from "readline/promises";

import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
}

class MCPClient {
    private mcp: Client;
    private transport: StreamableHTTPClientTransport | null = null;
    private genAI: GoogleGenAI;
    private tools: FunctionDeclaration[] = [];
    private conversationHistory: any[] = []; // Store the entire conversation

    constructor() {
        this.genAI = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });
        this.mcp = new Client({ name: "mcp-client", version: "1.0.0" });
    }

    async connectToServer(serverUrl: string) {
        /**
         * Connect to an MCP server
         *
         * @param serverUrl - The MCP server URL
         */
        try {
            // Initialize transport and connect to server
            const url = new URL(serverUrl);
            this.transport = new StreamableHTTPClientTransport(url);
            await this.mcp.connect(this.transport);
            this.setUpTransport();

            // List available tools
            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    parameters: {
                        ...tool.inputSchema,
                        type: Type.OBJECT,
                        properties: tool.inputSchema.properties as Record<string, Schema> | undefined
                    }
                };
            });
            console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name)
            );
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    private setUpTransport() {
        if (this.transport === null) {
            return;
        }
        this.transport.onclose = async () => {
            console.log("SSE transport closed.");
            if (this.transport) {
                await this.transport.close();
            }
        };

        this.transport.onerror = async (error) => {
            console.log("SSE transport error: ", error);
            if (this.transport) {
                await this.transport.close();
            }
        };
    }

    async processQuery(query: string) {
        // Add the new user message to conversation history
        this.conversationHistory.push({
            role: "user",
            parts: [{
                text: query,
            }],
        });

        const config = {
            tools: [{
                functionDeclarations: this.tools
            }]
        };

        console.log("Processing query with conversation history and config");

        const response = await this.genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: this.conversationHistory,
            config: config
        });

        let finalText = "";

        if (!response.functionCalls || response.functionCalls.length === 0) {
            // No function calls, just add the response to history
            finalText = response.text || "";
            this.conversationHistory.push({
                role: "model",
                parts: [{
                    text: finalText,
                }],
            });
            return finalText;
        }

        // Handle function calls
        const toolCallResults: string[] = [];
        
        // Add the assistant's response with function calls to history
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            this.conversationHistory.push(response.candidates[0].content as any);
        }

        // Process each function call
        for (const toolCall of response.functionCalls) {
            if (!toolCall.name) {
                console.error("Tool call without a name:", toolCall);
                continue;
            }

            console.log(`Calling function: ${toolCall.name}`);
            console.log('Parameters:', JSON.stringify(toolCall.args, null, 2));

            const toolResult = await this.mcp.callTool({
                name: toolCall.name,
                arguments: toolCall.args,
            });

            toolCallResults.push(`[Called tool ${toolCall.name} with args ${JSON.stringify(toolCall.args)}]`);

            const functionResponsePart = {
                name: toolCall.name,
                response: (toolResult.content as any[])[0]
            };

            // Add function response to conversation history
            this.conversationHistory.push({
                role: "user",
                parts: [{ functionResponse: functionResponsePart } as any],
            });
        }

        // Get final response after all function calls
        const nextResponse = await this.genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: this.conversationHistory,
            config: config
        });

        const assistantResponse = nextResponse.text || "";
        
        // Add the final assistant response to history
        this.conversationHistory.push({
            role: "model",
            parts: [{
                text: assistantResponse,
            }],
        });

        finalText = [...toolCallResults, assistantResponse].join("\n");
        
        return finalText;
    }

    async chatLoop() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            console.log("Type your queries or 'quit' to exit.");
            console.log("The conversation context will be maintained across messages.");

            while (true) {
                const message = await rl.question("\nQuery: ");
                if (message.toLowerCase() === "quit") {
                    break;
                }
                const response = await this.processQuery(message);
                console.log("\n" + response);
            }
        } finally {
            rl.close();
            this.showHistory();
        }
    }

    // Method to clear conversation history if needed
    clearHistory() {
        this.conversationHistory = [];
        console.log("Conversation history cleared.");
    }

    // Method to view conversation history (for debugging)
    showHistory() {
        console.log("Conversation History:");
        console.log(JSON.stringify(this.conversationHistory, null, 2));
    }

    async cleanup() {
        this.transport = null;
        await this.mcp.close();
    }
}

async function main() {
    const port = 3005;
    const mcpClient = new MCPClient();

    try {
        await mcpClient.connectToServer(`http://localhost:${port}/mcp`);
        await mcpClient.chatLoop();
    } finally {
        await mcpClient.cleanup();
        process.exit(0);
    }
}

main();