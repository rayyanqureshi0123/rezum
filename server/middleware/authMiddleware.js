import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  try {
    let token;

    // 🔹 Check token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 🔹 If no token
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    // 🔹 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Attach user to request
    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
};

export default protect;