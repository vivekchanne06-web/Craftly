import express from 'express';
import morgan from 'morgan';
import agentRouter from "./routes/agent.routes.js"

const app = express();

// Middleware
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());


app.get('/api/status/healthz', (req, res) => {
  res.status(200).json({ message: 'Welcome to the AI Orchestration API!' });
});

app.use('/api/ai/', agentRouter);

export default app;
