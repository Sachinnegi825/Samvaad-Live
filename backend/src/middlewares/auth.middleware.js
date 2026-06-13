import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * HTTP Auth Middleware
 * 
 * Used to protect standard REST API routes (Express).
 * Reads the JWT from the Authorization header: "Bearer <token>"
 * If valid, attaches the user document to req.user and calls next().
 * If invalid or missing, returns 401.
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Check for token in the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    // 2. Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // 3. Verify the token signature using our secret
    // jwt.verify throws an error if the token is expired or tampered
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user from the decoded token payload
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    // 5. Attach user to request for use in the next controller
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    res.status(500).json({ message: 'Server error in auth middleware.' });
  }
};
