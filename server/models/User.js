import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🔹 Google OAuth (optional)
    googleId: {
      type: String,
    },

    // 🔹 Basic Info
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 🔹 Password (only for email login)
    password: {
      type: String,
      minlength: 6,
    },

    // 🔹 Custom profile image (Cloudinary URL)
    profileImage: {
      type: String,
      default: "",
    },

    // 🔹 Optional future features
    bio: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "user",
    },
  },
  {
    timestamps: true, // 🔥 adds createdAt & updatedAt
  }
);

const User = mongoose.model("User", userSchema);

export default User;