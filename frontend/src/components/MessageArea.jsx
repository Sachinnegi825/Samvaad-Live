import { useState, useEffect, useRef } from 'react';
import { FiSend, FiLoader, FiArrowLeft } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

function MessageArea({ socket, isMobile }) {
  const { user } = useAuthStore();
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    typingUsers,
    addMessage,
    setTyping,
    clearTyping,
    selectConversation,
    markMessagesAsRead,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (message) => {
      if (message.conversationId === activeConversation?._id) {
        addMessage(message);
        socket.emit('message-read', { conversationId: message.conversationId });
      }
    };

    const onUserTyping = (data) => {
      if (data.conversationId === activeConversation?._id) {
        setTyping(data.conversationId, data.username);
      }
    };

    const onUserStopTyping = (data) => {
      clearTyping(data.conversationId);
    };

    const onMessagesRead = (data) => {
      if (data.conversationId === activeConversation?._id) {
        markMessagesAsRead(data.conversationId);
      }
    };

    socket.on('receive-message', onReceiveMessage);
    socket.on('user-typing', onUserTyping);
    socket.on('user-stop-typing', onUserStopTyping);
    socket.on('messages-read', onMessagesRead);

    return () => {
      socket.off('receive-message', onReceiveMessage);
      socket.off('user-typing', onUserTyping);
      socket.off('user-stop-typing', onUserStopTyping);
      socket.off('messages-read', onMessagesRead);
    };
  }, [socket, activeConversation, addMessage, setTyping, clearTyping, markMessagesAsRead]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    socket.emit(
      'send-message',
      { conversationId: activeConversation._id, text: inputText.trim() },
      () => {}
    );

    setInputText('');
    socket.emit('stop-typing', { conversationId: activeConversation._id });
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    socket.emit('typing', { conversationId: activeConversation._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId: activeConversation._id });
    }, 2000);
  };

  const getOtherParticipant = () => {
    if (!activeConversation) return null;
    if (activeConversation.isGroup) return { username: activeConversation.name, isOnline: false };
    const currentUserId = user?.id || user?._id;
    return activeConversation.participants.find((p) => p._id !== currentUserId);
  };

  const otherParticipant = getOtherParticipant();
  const typingLabel = activeConversation ? typingUsers[activeConversation._id] : null;

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="comic-border bg-yellow-400 p-8 text-center transform -rotate-2">
          <h2 className="text-3xl font-bold uppercase">KAPOW!</h2>
          <p className="font-bold">Select a chat to start!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
      
      {/* Header */}
      <div className="border-b-4 border-black bg-secondary p-3 md:p-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          {isMobile && (
            <button 
              type="button"
              onClick={() => selectConversation(null)}
              className="flex items-center justify-center comic-border bg-white text-black p-2 rounded-full cursor-pointer hover:bg-yellow-200 active:translate-y-1"
            >
              <FiArrowLeft className="h-6 w-6 stroke-[3px]" />
            </button>
          )}
          
          <div className="flex items-center justify-center font-bold flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-black bg-white text-black md:text-xl">
            {otherParticipant?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold uppercase text-lg md:text-xl text-white truncate">
              {otherParticipant?.username}
            </h2>
            <p className="text-xs text-black font-bold uppercase">
              {typingLabel ? (
                <span className="text-yellow-300">{typingLabel} is typing...</span>
              ) : otherParticipant?.isOnline ? (
                <span className="text-green-300">Online</span>
              ) : (
                <span>Offline</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white comic-halftone scroll-smooth min-h-0 scrollbar-hide">
        {isLoadingMessages ? (
          <div className="text-center p-4 font-bold"><FiLoader className="animate-spin inline" /> Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center p-4 font-bold opacity-80 bg-white comic-border mx-auto transform rotate-1 mt-10">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg, idx) => {
            const currentUserId = user?.id || user?._id;
            const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;

            return (
              <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
                <div className={`relative comic-border px-3 md:px-4 py-2 md:py-3 font-bold text-base md:text-lg max-w-[85%] md:max-w-[80%] ${
                  isMe ? 'bg-primary text-white transform -rotate-1' : 'bg-white text-black transform rotate-1'
                }`}>
                  {msg.text}
                  {/* Speech Bubble Tail */}
                  <div className={`comic-bubble-tail ${isMe ? 'right bg-primary' : 'left bg-white'}`}></div>
                </div>
                <div className="text-xs font-bold mt-2 bg-white px-2 border-2 border-black">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <span className="ml-1">{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="border-t-4 border-black bg-yellow-400 p-2 md:p-4 flex-shrink-0 z-10 w-full">
        <form onSubmit={handleSend} className="flex items-center gap-2 h-full w-full">
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 min-w-0 transition-all focus:outline-none comic-border bg-white text-black font-bold px-3 py-2 md:px-4 md:py-3 text-base md:text-lg h-12 md:h-14"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 flex-shrink-0 comic-border bg-primary text-white font-bold h-12 md:h-14 px-4 md:w-20 text-base md:text-lg hover:bg-red-400 active:translate-y-1"
          >
            BAM!
          </button>
        </form>
      </div>
    </div>
  );
}

export default MessageArea;
