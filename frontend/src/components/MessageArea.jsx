import { useState, useEffect, useRef } from 'react';
import { FiSend, FiLoader, FiMessageCircle } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';

/**
 * MessageArea Component
 * 
 * Displays the messages for the active conversation
 * and the message input box.
 */
function MessageArea({ socket }) {
  const { user } = useAuthStore();
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    typingUsers,
    addMessage,
    setTyping,
    clearTyping,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen to socket events for the active conversation
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (message) => {
      // Only add the message if it's for the active conversation
      if (message.conversationId === activeConversation?._id) {
        addMessage(message);
        // Tell server we've read it
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

    socket.on('receive-message', onReceiveMessage);
    socket.on('user-typing', onUserTyping);
    socket.on('user-stop-typing', onUserStopTyping);

    return () => {
      socket.off('receive-message', onReceiveMessage);
      socket.off('user-typing', onUserTyping);
      socket.off('user-stop-typing', onUserStopTyping);
    };
  }, [socket, activeConversation, addMessage, setTyping, clearTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    // Emit with an ACKNOWLEDGEMENT CALLBACK
    // The 3rd argument is a function — the server calls it back to confirm
    socket.emit(
      'send-message',
      { conversationId: activeConversation._id, text: inputText.trim() },
      (response) => {
        if (response.error) {
          console.error('Message failed:', response.error);
        }
        // If success, the server broadcasts the message back to the room
        // and our onReceiveMessage listener handles adding it to state
      }
    );

    setInputText('');
    // Stop typing indicator
    socket.emit('stop-typing', { conversationId: activeConversation._id });
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);

    // Emit typing event
    socket.emit('typing', { conversationId: activeConversation._id });

    // Auto-stop typing after 2 seconds of inactivity
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId: activeConversation._id });
    }, 2000);
  };

  // Get the display name for the conversation header
  const getOtherParticipant = () => {
    if (!activeConversation) return null;
    if (activeConversation.isGroup) return { username: activeConversation.name, isOnline: false };
    return activeConversation.participants.find((p) => p._id !== user?.id);
  };

  const otherParticipant = getOtherParticipant();
  const typingLabel = activeConversation ? typingUsers[activeConversation._id] : null;

  // No conversation selected state
  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="h-16 w-16 rounded-2xl bg-slate-800/60 border border-white/5 flex items-center justify-center">
          <FiMessageCircle className="h-7 w-7 text-slate-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-400">Select a conversation</p>
          <p className="text-sm text-slate-600 mt-1">or start a new one with the + button</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Conversation Header */}
      <div className="glass-card-dark border-b border-white/5 px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-700 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
            {otherParticipant?.username?.[0]?.toUpperCase()}
          </div>
          {otherParticipant?.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          )}
        </div>
        <div>
          <h2 className="font-bold text-slate-100 text-sm leading-tight">{otherParticipant?.username}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {typingLabel ? (
              <span className="text-violet-400 italic">{typingLabel} is typing...</span>
            ) : otherParticipant?.isOnline ? (
              <span className="text-emerald-400">Online</span>
            ) : (
              <span>
                {otherParticipant?.lastSeen
                  ? `Last seen ${new Date(otherParticipant.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Offline'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 min-h-0">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <FiLoader className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
            return (
              <div key={msg._id || idx} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-300">
                    {(msg.sender?.username || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe
                      ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-br-sm shadow-lg shadow-violet-900/30'
                      : 'glass-card text-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* Read receipt ticks for sent messages */}
                    {isMe && (
                      <span className={`text-[10px] font-bold ${msg.status === 'read' ? 'text-blue-400' : 'text-slate-500'}`}>
                        {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="glass-card-dark border-t border-white/5 p-4 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-12 w-12 bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 active:scale-95 cursor-pointer flex-shrink-0"
          >
            <FiSend className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default MessageArea;
