import { Router } from "express";
import passport from "passport";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendAuthNotification } from "../config/mq.js";

const router = Router();

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

const NODE_ENV = process.env.NODE_ENV || "development";

router.get('/google', passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: FRONTEND_URL
}),
    async (req, res) => {
        try {
            const { id, displayName, emails, photos } = req.user;

            let user = await User.findOne({
                googleId: id
            });

            if (!user) {
                user = new User({
                    googleId: id,
                    email: emails[0].value,
                    name: displayName,
                    avatar: photos?.[0]?.value
                });

                await user.save();
            }

            await sendAuthNotification({
                userId: user._id,
                action: 'google_login',
                timestamp: new Date(),
                email: emails[0].value
            });

            const token = jwt.sign(
                {
                    id: user._id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1h'
                }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: NODE_ENV === "production",
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 1000
            });

            console.log('JWT generated for:', user.email);

            res.redirect(FRONTEND_URL);
        } catch (err) {
            console.error(
                'Error during Google authentication:',
                err
            );

            res.redirect(FRONTEND_URL);
        }
    }
);

export default router;