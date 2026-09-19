import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import sandboxRouter from './routes/sandbox.routes.js';

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));


app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    message: "Sandbox api is healthy" });
});

app.use("/api/sandbox", sandboxRouter);



export default app;