import { useState, useEffect } from 'react';
import './App.css';
import ThemeToggle from './components/ThemeWidget';
import ThoughtForm from './components/ThoughtForm';
import ThoughtList from './components/ThoughtList';
import Toast from './components/Toast';
import AuthForm from './components/AuthForm';
import RoomManager from './components/RoomManager';
import UserProfileView from './components/UserProfile'; // Import Profile
import { useThoughts } from './hooks/useThoughts';
import { thoughtService, roomService, type User } from './services/thoughtService';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDarkMode]);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    showToast("Welcome back!", "success");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    showToast("Logged out.", "success");
  };

  if (!token) {
    return (
      <div className="app-container">
         <ThemeToggle isDark={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
         <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <h1>The Thought Wall</h1>
         </div>
         {toast && <div className="toast-container"><Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} /></div>}
         <AuthForm onLogin={handleLogin} />
      </div>
    );
  }

  return <AuthenticatedApp 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            handleLogout={handleLogout}
            showToast={showToast}
            toast={toast}
            setToast={setToast}
         />;
}

function AuthenticatedApp({ isDarkMode, setIsDarkMode, handleLogout, showToast, toast, setToast }: any) {
  const [activeRoomId, setActiveRoomId] = useState<number | undefined>(undefined);
  const [roomMembers, setRoomMembers] = useState<User[]>([]);
  const [showProfile, setShowProfile] = useState(false); // Profile View State

  const defaultTags = ["General", "Idea", "To-Do", "Journal", "Dream"];
  const [customTags, setCustomTags] = useState<string[]>([]);
  const availableTags = [...defaultTags, ...customTags];
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { 
      thoughts, loading, addThought, editThought, togglePin, removeThought, toggleComplete, assignUser,
      page, setPage, totalPages, setFilter, refresh 
  } = useThoughts("All", activeRoomId);

  useEffect(() => {
    if(activeRoomId) {
        roomService.getMembers(activeRoomId).then(setRoomMembers).catch(console.error);
    } else {
        setRoomMembers([]);
    }
    setActiveFilter("All");
    setFilter("All");
  }, [activeRoomId, setFilter]);

  const handleAddThought = async (content: string, tag: string) => {
    if (tag && !availableTags.includes(tag)) setCustomTags(prev => [...prev, tag]);
    const success = await addThought(content, tag);
    if (success) showToast("Thought captured!", "success");
    return success;
  };

  const handleEditThought = async (id: number, content: string, tag: string) => {
      if (tag && !availableTags.includes(tag)) setCustomTags(prev => [...prev, tag]);
      const success = await editThought(id, content, tag);
      if (success) showToast("Thought updated!", "success");
      return success;
  };

  const handleDeleteTag = async (tagToDelete: string) => {
      setCustomTags(prev => prev.filter(t => t !== tagToDelete));
      if (activeFilter === tagToDelete) { setActiveFilter("All"); setFilter("All"); setPage(0); }
      try {
          await thoughtService.migrateTag(tagToDelete, "General");
          refresh();
          showToast("Tag deleted.", "success");
      } catch (error) { showToast("Failed.", "error"); }
  };

  const displayedThoughts = thoughts.filter(t => t.content.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="app-container">
        {/* Header with Theme, Profile, and Logout */}
        <div className="header-container">
            <h1 style={{margin:0, fontSize: '1.8rem'}}>The Thought Wall</h1>
            <div className="header-actions">
                <ThemeToggle isDark={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
                <button className="icon-btn" onClick={() => setShowProfile(true)} title="My Profile">👤</button>
                <button className="icon-btn" onClick={handleLogout} title="Logout">🚪</button>
            </div>
        </div>

        {toast && (
            <div className="toast-container">
                <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
            </div>
        )}

        {/* Conditional Rendering: Profile OR Main Board */}
        {showProfile ? (
            <UserProfileView 
                onClose={() => setShowProfile(false)} 
                onLogout={handleLogout}
                onNavigateToRoom={(id) => { setActiveRoomId(id); setShowProfile(false); }}
            />
        ) : (
            <>
                <RoomManager activeRoomId={activeRoomId} onRoomSelect={setActiveRoomId} />

                <ThoughtForm onAdd={handleAddThought} availableTags={availableTags} defaultTags={defaultTags} onDeleteTag={handleDeleteTag} />

                <div style={{ marginBottom: '1rem' }}>
                    <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="thought-input" />
                </div>

                <div className="filter-bar">
                    <div className="filter-options">
                        <button onClick={() => {setActiveFilter("All"); setFilter("All"); setPage(0);}} className={`filter-chip ${activeFilter === "All" ? 'active' : ''}`}>All</button>
                        {availableTags.map(t => (
                            <button key={t} onClick={() => {setActiveFilter(t); setFilter(t); setPage(0);}} className={`filter-chip ${activeFilter === t ? 'active' : ''}`}>{t}</button>
                        ))}
                    </div>
                </div>
                
                <ThoughtList 
                    thoughts={displayedThoughts} 
                    loading={loading} 
                    onDelete={async (id) => { if(await removeThought(id)) showToast("Deleted", "success"); }} 
                    onEdit={handleEditThought}
                    onPin={togglePin}
                    onToggleComplete={toggleComplete}
                    onAssign={assignUser}
                    roomMembers={activeRoomId ? roomMembers : undefined}
                />

                {totalPages > 1 && (
                    <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem'}}>
                        <button className="tag-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <span>{page + 1} / {totalPages}</span>
                        <button className="tag-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                )}
            </>
        )}
    </div>
  );
}
export default App;