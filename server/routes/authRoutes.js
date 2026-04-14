import express from "express";
import passport from "../config/passport.js";

import {
  googleAuth,
  googleCallback,
  registerUser,
  loginUser,
} from "../controllers/authController.js";

const router = express.Router();

// ================= GOOGLE AUTH =================

// 🔹 Start Google Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  googleAuth
);

// 🔹 Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    session: false,
  }),
  googleCallback
);

// ================= EMAIL AUTH =================

// 🔹 Register (Signup)
router.post("/register", registerUser);

// 🔹 Login
router.post("/login", loginUser);

export default router;