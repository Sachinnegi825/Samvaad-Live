import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import Sidebar from '../components/Sidebar';
import MessageArea from '../components/MessageArea';

function ChatPage() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const { updateUserStatus } = useChatStore();

  // Pass the JWT token so socket connects with auth
  const socket = useSocket(token);

  useEffect(() => {
    // Handle rejected socket connection (invalid/expired token)
    const onConnectError = (err) => {
      if (err.message.includes('Authentication')) {
        logout();
        navigate('/login');
      }
    };

    // Handle global online/offline status updates
    const onStatusChange = ({ userId, isOnline, lastSeen }) => {
      updateUserStatus(userId, isOnline, lastSeen);
    };

    socket.on('connect_error', onConnectError);
    socket.on('user-status-change', onStatusChange);

    return () => {
      socket.off('connect_error', onConnectError);
      socket.off('user-status-change', onStatusChange);
    };
  }, [socket, logout, navigate, updateUserStatus]);

  return (
    <div className="min-h-screen flex antialiased overflow-hidden" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 glass-card-dark border-r border-white/5 flex flex-col overflow-hidden">
        <Sidebar socket={socket} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageArea socket={socket} />
      </div>
    </div>
  );
}

export default ChatPage;
