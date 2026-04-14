import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";

// ================= GOOGLE AUTH =================

const googleAuth = (req, res, next) => {
  next();
};

//  GOOGLE CALLBACK
const googleCallback = async (req, res) => {
  try {
    const profile = req.user;

    // check if user exists
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // check if email already exists (important edge case)
      const existingEmailUser = await User.findOne({
        email: profile.emails[0].value,
      });

      if (existingEmailUser) {
        // link google account
        existingEmailUser.googleId = profile.id;
        await existingEmailUser.save();
        user = existingEmailUser;
      } else {
        // create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profileImage: "",
        });
      }
    }

    // generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Google login successful",
      user,
      token,
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all fields",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

   
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImage: "",
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Please login with Google",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 🔹 Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};


export {
  googleAuth,
  googleCallback,
  registerUser,
  loginUser,
};