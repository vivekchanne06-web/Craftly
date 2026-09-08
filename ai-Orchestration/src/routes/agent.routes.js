import { Router } from "express";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
    try {
        const { message, projectId } = req.body;

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        console.log("========== AGENT STREAM START ==========");
        console.log("projectId:", projectId);
        console.log("message:", message);
        console.log("Calling agent.stream()...");

        const response = await agent.stream(
            {
                messages: [{
                    role: "user",
                    content: message
                }]
            },
            {
                context: {
                    projectId
                },
                
            }
        );
        console.log("agent.stream() returned successfully");

        for await (const chunk of response) {
            console.log("STREAM CHUNK:", chunk);
            res.write(
                `data: ${JSON.stringify(chunk)}\n\n`
            );
        }

        res.end();

    } catch (error) {
        console.error("Error invoking agent:", error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Failed to invoke agent"
            });
        } else {
            res.write(
                `event: error\ndata: ${JSON.stringify({
                    error: "Failed to invoke agent"
                })}\n\n`
            );
            res.end();
        }
    }
});

export default agentRouter;