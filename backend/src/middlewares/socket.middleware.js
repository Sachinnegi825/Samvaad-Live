import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Socket.IO Auth Middleware
 * 
 * This is the equivalent of the HTTP auth middleware but for WebSocket connections.
 * 
 * How it works:
 * - When the frontend calls io('http://...', { auth: { token: '...' } }),
 *   Socket.IO puts the token in socket.handshake.auth.token.
 * - This middleware runs BEFORE the 'connection' event fires.
 * - If the token is valid, we attach the user to socket.user and call next().
 * - If invalid, we call next(new Error('...')) which REJECTS the connection.
 * 
 * The client receives the rejection as a 'connect_error' event.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // 1. Get the token from the socket handshake (sent by the frontend)
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch the full user from the database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // 4. Attach the user object directly to the socket
    // Now in ALL our event handlers (socket.on(...)), we can access socket.user
    socket.user = user;

    next(); // ✅ Allow the connection
  } catch (error) {
    // Token is invalid or expired
    next(new Error('Authentication error: Invalid token'));
  }
};

export default socketAuthMiddleware;
