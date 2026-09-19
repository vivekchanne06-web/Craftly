import { Router } from "express";
import passport from "passport";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendAuthNotification } from "../config/mq.js";

const router = Router();

router.get('/google', passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email']
}));

router.get('/google/callback',passport.authenticate('google', {
        session: false,
        failureRedirect: 'http://localhost:5173'
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
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 1000
            });

            console.log('JWT generated for:', user.email);

            res.redirect('http://localhost:5173');
        } catch (err) {
            console.error(
                'Error during Google authentication:',
                err
            );

            res.redirect('http://localhost:5173');
        }
    }
);

export default router;