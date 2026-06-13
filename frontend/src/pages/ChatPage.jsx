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

  const socket = useSocket(token);

  useEffect(() => {
    const onConnectError = (err) => {
      if (err.message.includes('Authentication')) {
        logout();
        navigate('/login');
      }
    };

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 gap-6 comic-halftone font-[var(--font-comic)]">
      <div className="w-80 h-[85vh] bg-white comic-border flex flex-col overflow-hidden transform -rotate-1">
        <Sidebar socket={socket} />
      </div>
      <div className="flex-1 h-[85vh] max-w-5xl bg-white comic-border flex flex-col overflow-hidden transform rotate-1">
        <MessageArea socket={socket} />
      </div>
    </div>
  );
}

export default ChatPage;
