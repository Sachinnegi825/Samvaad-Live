import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import Sidebar from '../components/Sidebar';
import MessageArea from '../components/MessageArea';

function ChatPage() {
  const navigate = useNavigate();
  const { token, logout, user } = useAuthStore();
  const { updateUserStatus, activeConversation, updateConversationPreview } = useChatStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const socket = useSocket(token);

  useEffect(() => {
    if (!socket) return;

    const onConnectError = (err) => {
      console.error('[Socket] Connection error:', err.message);
      if (err.message.includes('token') || err.message.includes('authorized')) {
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

  // Listen for message previews for inactive chats
  useEffect(() => {
    if (!socket || !user) return;
    const currentUserId = user.id || user._id;

    const onNewMessagePreview = (data) => {
      if (activeConversation?._id !== data.conversationId) {
        updateConversationPreview(data.conversationId, data.lastMessage);
      }
    };

    socket.on(`new-message-preview:${currentUserId}`, onNewMessagePreview);

    return () => {
      socket.off(`new-message-preview:${currentUserId}`, onNewMessagePreview);
    };
  }, [socket, user, activeConversation, updateConversationPreview]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 md:p-8 gap-6 comic-halftone font-[var(--font-comic)] overflow-hidden">
      
      {/* Sidebar: Show on Desktop OR (Mobile AND No active chat) */}
      {(!isMobile || !activeConversation) && (
        <div className="w-full md:w-80 h-[95vh] md:h-[85vh] bg-white comic-border flex flex-col overflow-hidden md:-rotate-1 flex-shrink-0">
          <Sidebar socket={socket} />
        </div>
      )}

      {/* Message Area: Show on Desktop OR (Mobile AND Active chat) */}
      {(!isMobile || activeConversation) && (
        <div className="flex-1 w-full h-[95vh] md:h-[85vh] max-w-5xl bg-white comic-border flex flex-col overflow-hidden md:rotate-1">
          <MessageArea socket={socket} isMobile={isMobile} />
        </div>
      )}

    </div>
  );
}

export default ChatPage;
