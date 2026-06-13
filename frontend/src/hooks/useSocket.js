import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Singleton socket instance.
 * autoConnect: false means it won't connect immediately on import.
 * We connect manually after the user is authenticated so we can pass the JWT token.
 */
const socket = io('http://localhost:5000', {
  autoConnect: false,
});

/**
 * useSocket - Custom hook to get the socket instance.
 * 
 * @param {string|null} token - The JWT token from the auth store.
 *   When a token is provided, it is added to the socket's handshake auth
 *   so the server's socketAuthMiddleware can verify it.
 */
export const useSocket = (token = null) => {
  const socketRef = useRef(socket);

  useEffect(() => {
    if (token) {
      // Attach token to handshake BEFORE connecting
      socketRef.current.auth = { token };
      
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
    } else {
      // If no token (logged out), disconnect
      if (socketRef.current.connected) {
        socketRef.current.disconnect();
      }
    }
  }, [token]); // Re-run when token changes (login/logout)

  return socketRef.current;
};

export default socket;
