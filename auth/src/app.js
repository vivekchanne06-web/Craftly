import "dotenv/config";
import express from "express";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { Strategy as googleStrategy } from "passport-google-oauth20";
import passport from "passport";
import cookies from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";



const app = express();

app.use(morgan("dev"));
app.use(cookies());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


passport.use(new googleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://127.0.0.1/api/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
    // Here you would typically find or create a user in your database
    // For this example, we'll just return the profile
    return done(null, profile);
}));


app.get("/_status/healthz", (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get("/_status/readyz", (req, res) => {
    res.status(200).json({ status: 'ready' });
});


app.use("/api/auth", authRoutes);

export default app;