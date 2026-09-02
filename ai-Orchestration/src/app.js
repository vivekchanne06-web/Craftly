import express from 'express';
import morgan from 'morgan';


const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());



app.get('/api/healthz', (req, res) => {
  res.status(200).json({ message: 'Welcome to the AI Orchestration API!' });
});

export default app;

