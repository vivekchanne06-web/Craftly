import express from "express";
import morgan from "morgan";
import fs from "fs";

const WORKING_DIR = '/workspace';
const app = express();

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
     message: "Agent is healthy!",
     status: "success" 
    });
});

app.get("/list-files",async  (req, res) => {
  try {
    const elements = await fs.promises.readdir(WORKING_DIR);
    res.status(200).json({
      message: "Files listed successfully!",
      status: "success",
      elements
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error occurred while listing files.",
      status: "error"
    })
  }
});

export default app;