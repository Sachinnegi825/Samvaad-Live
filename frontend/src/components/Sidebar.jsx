import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiEdit, FiX, FiLogOut, FiLoader } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import useChatStore from '../store/useChatStore';
import { searchUsers } from '../services/conversation.service';

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
    socket.emit('join-conversation', conv._id);
    socket.emit('message-read', { conversationId: conv._id });
    if (onSelectConversation) onSelectConversation(conv);
  };

  const getConversationDisplay = (conv) => {
    if (conv.isGroup) return { name: conv.name, avatar: null };
    const currentUserId = user?.id || user?._id;
    const other = conv.participants.find((p) => p._id !== currentUserId);
    return { name: other?.username || 'Unknown', avatar: other?.avatar, isOnline: other?.isOnline, other };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b-4 border-black bg-primary text-white flex justify-between items-center">
        <h1 className="text-xl font-bold uppercase tracking-wider" style={{ textShadow: '2px 2px 0 #000' }}>Chats!</h1>
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="comic-border bg-yellow-400 text-black w-10 h-10 flex items-center justify-center rounded-full hover:bg-yellow-300 transition-transform active:translate-y-1 active:shadow-[4px_4px_0_black] cursor-pointer"
        >
          {showSearch ? <FiX className="h-5 w-5 stroke-[3px]" /> : <FiEdit className="h-5 w-5 stroke-[2.5px] ml-1 mb-1" />}
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="relative p-4 border-b-4 border-black bg-secondary">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 focus:outline-none transition-all comic-border bg-white text-black font-bold placeholder-black/50"
            />
          </div>
          {(searchResults.length > 0 || isSearching) && (
            <div className="absolute left-0 right-0 z-50 overflow-hidden comic-border bg-white mt-2 top-full">
              {isSearching ? (
                <div className="p-4 text-center"><FiLoader className="animate-spin mx-auto" /></div>
              ) : (
                searchResults.map(u => (
                  <button
                    key={u._id}
                    onClick={() => handleStartConversation(u._id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 border-b-4 border-black hover:bg-yellow-200 font-bold uppercase cursor-pointer"
                  >
                    <span>{u.username}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoadingConversations ? (
          <div className="p-4 text-center font-bold">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center font-bold opacity-50">No conversations</div>
        ) : (
          <ul>
            {conversations.map((conv) => {
              const { name, isOnline } = getConversationDisplay(conv);
              const isActive = activeConversation?._id === conv._id;
              
              return (
                <li key={conv._id}>
                  <button
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 text-left transition-all p-4 border-b-4 border-black cursor-pointer ${isActive ? 'bg-yellow-300' : 'bg-white hover:bg-gray-100'}`}
                  >
                    {/* Avatar */}
                    <div className="relative flex items-center justify-center font-bold flex-shrink-0 w-12 h-12 rounded-full border-4 border-black bg-primary text-white text-xl">
                      {name?.[0]?.toUpperCase()}
                      {isOnline && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-black rounded-full" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold truncate uppercase text-lg">
                          {name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <div className="bg-red-500 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-black text-xs flex-shrink-0 ml-2">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      {conv.lastMessage?.text && (
                        <p className="truncate text-sm font-bold opacity-70">
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

      {/* User Info & Logout */}
      <div className="border-t-4 border-black bg-secondary p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center font-bold w-10 h-10 rounded-full border-4 border-black bg-white text-black">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="font-bold uppercase text-white">
            {user?.username}
          </span>
        </div>
        <button
          onClick={logout}
          className="comic-border bg-white p-2 rounded-full hover:bg-gray-200 active:translate-y-1 cursor-pointer"
          title="Logout"
        >
          <FiLogOut className="stroke-[3px]" />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
