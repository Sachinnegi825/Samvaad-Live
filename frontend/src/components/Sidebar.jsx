import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiPlus, FiX, FiMessageCircle, FiLogOut, FiLoader } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import { searchUsers } from '../services/conversation.service';

/**
 * Sidebar Component
 * Shows the list of conversations + a user search to start new chats.
 */
function Sidebar({ socket, onSelectConversation }) {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    isLoadingConversations,
    loadConversations,
    startConversation,
    selectConversation,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Debounced search — wait 400ms after user stops typing before calling API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await searchUsers(searchQuery);
        setSearchResults(data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  const handleStartConversation = async (participantId) => {
    const conv = await startConversation(participantId);
    if (conv) {
      handleSelectConversation(conv);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSelectConversation = async (conv) => {
    await selectConversation(conv);
    // Tell the server we are joining this conversation's room
    socket.emit('join-conversation', conv._id);
    // Tell the server to mark messages as read
    socket.emit('message-read', { conversationId: conv._id });
    if (onSelectConversation) onSelectConversation(conv);
  };

  // Helper: get the "other" participant's name for private chats
  const getConversationDisplay = (conv) => {
    if (conv.isGroup) return { name: conv.name, avatar: null };
    const other = conv.participants.find((p) => p._id !== user?.id);
    return { name: other?.username || 'Unknown', avatar: other?.avatar, isOnline: other?.isOnline, other };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center">
              <FiMessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-white tracking-tight">Chatwave</span>
          </div>
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            title="New conversation"
          >
            {showSearch ? <FiX className="h-4 w-4" /> : <FiPlus className="h-4 w-4" />}
          </button>
        </div>

        {/* Search for users to start a new chat */}
        {showSearch && (
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              autoFocus
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
            />
            {/* Search Results Dropdown */}
            {(searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-xl overflow-hidden z-50 border border-white/10 shadow-xl">
                {isSearching ? (
                  <div className="p-3 text-center">
                    <FiLoader className="h-4 w-4 animate-spin text-slate-400 mx-auto" />
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => handleStartConversation(u._id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <div className="relative">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-700 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.username[0].toUpperCase()}
                        </div>
                        {u.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                        )}
                      </div>
                      <span className="text-sm text-slate-200 font-medium">{u.username}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center h-32">
            <FiLoader className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center px-4">
            <FiMessageCircle className="h-8 w-8 mb-2 text-slate-600" />
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs mt-1">Click + to start chatting</p>
          </div>
        ) : (
          <ul className="py-2">
            {conversations.map((conv) => {
              const { name, isOnline } = getConversationDisplay(conv);
              const isActive = activeConversation?._id === conv._id;
              return (
                <li key={conv._id}>
                  <button
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${
                      isActive ? 'bg-violet-600/15 border-r-2 border-violet-500' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-700 to-blue-600 flex items-center justify-center text-sm font-bold text-white`}>
                        {name?.[0]?.toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Conversation info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-200 truncate">{name}</span>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-500 flex-shrink-0 ml-1">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage?.text && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {conv.lastMessage.text}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Current user info + logout */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
            title="Sign out"
          >
            <FiLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
