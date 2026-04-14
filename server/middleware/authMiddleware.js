import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');

      // If the token is valid but the user no longer exists in DB
      if (!user) {
        return res.status(401).json({ message: 'User account no longer exists' });
      }

      req.user = user;
      return next();
    } catch (error) {
      // Differentiate between expired and malformed tokens
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired, please login again' });
      }
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
