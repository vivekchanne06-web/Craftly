import { ChatMistralAI } from "@langchain/mistralai"
import dotenv from "dotenv";
dotenv.config();
import { createAgent } from "langchain";
import { listFiles, readFiles, updateFiles, deleteFiles } from "./tools.js";


const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRALAI_API_KEY,
    temperature: 0.7,

});
const agent = createAgent({
    model,
    tools: [
        listFiles,
        readFiles,
        updateFiles,
        deleteFiles
    ],
});

const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "delete css file content."
        }
    ]
});

console.log("================================="); console.log("AGENT RESULT");
console.log("=================================");

console.log(JSON.stringify(result, null, 2));