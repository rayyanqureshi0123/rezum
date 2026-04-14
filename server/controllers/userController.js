import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";

const uploadProfileImage = async (req, res) => {
  try {
    const file = req.file;

    // 🔹 Check if file exists
    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    // 🔹 Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "rezum_profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(file.buffer);
    });

    // 🔹 Update user profile image (FIXED HERE ✅)
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { returnDocument: "after" } // 🔥 updated option
    );

    // 🔹 Send response
    res.json({
      message: "Image uploaded successfully",
      profileImage: user.profileImage,
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      message: "Upload failed",
    });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    let updateData = {};

    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;

    // 🔥 Image update
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "rezum_profiles" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(req.file.buffer);
      });

      updateData.profileImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { returnDocument: "after" }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export { uploadProfileImage, updateProfile };