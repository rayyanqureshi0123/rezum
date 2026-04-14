import express from "express";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import { uploadProfileImage } from "../controllers/userController.js";
import { updateProfile } from "../controllers/userController.js";


const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json({
    message: "Profile fetched successfully",
    user,
  });
});

router.post(
  "/upload",
  protect,
  upload.single("image"),
  uploadProfileImage
);
router.put(
  "/update",
  protect,
  upload.single("image"), // required
  updateProfile
);
export default router;