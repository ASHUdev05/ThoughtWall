import { useState, useEffect } from 'react';
import './App.css';
import ThemeToggle from './components/ThemeWidget';
import ThoughtForm from './components/ThoughtForm';
import ThoughtList from './components/ThoughtList';
import Toast from './components/Toast'; 
import { useThoughts } from './hooks/useThoughts';
import { thoughtService } from './services/thoughtService';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Tag Management State
  const defaultTags = ["General", "Idea", "To-Do", "Journal", "Dream"];
  const [customTags, setCustomTags] = useState<string[]>([]);
  
  // Combine defaults with user-created tags
  const availableTags = [...defaultTags, ...customTags];

  // Hook handles Server-side Pagination & Filtering
  const { 
      thoughts, 
      loading, 
      addThought, 
      editThought,
      togglePin,
      removeThought, 
      page, 
      setPage, 
      totalPages,
      setFilter,
      refresh 
  } = useThoughts("All");

  const [activeFilter, setActiveFilter] = useState("All");

  // Handle Theme Logic
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  // --- Handlers ---

  const handleAddThought = async (content: string, tag: string) => {
    // If it's a new custom tag, add it to our local list
    if (tag && !availableTags.includes(tag)) {
        setCustomTags(prev => [...prev, tag]);
    }

    const success = await addThought(content, tag);
    if (success) {
        showToast("Thought captured!", "success");
        return true;
    } else {
        showToast("Failed to save. Is backend running?", "error");
        return false;
    }
  };

  const handleEditThought = async (id: number, content: string, tag: string) => {
      // Also capture new tags during edit
      if (tag && !availableTags.includes(tag)) {
          setCustomTags(prev => [...prev, tag]);
      }

      const success = await editThought(id, content, tag);
      if (success) showToast("Thought updated!", "success");
      else showToast("Failed to update.", "error");
      return success;
  };

  const handleDeleteThought = async (id: number) => {
    const success = await removeThought(id);
    if (success) showToast("Thought removed.", "success");
    else showToast("Could not delete.", "error");
  };

  const handleDeleteTag = async (tagToDelete: string) => {
      // 1. Remove from UI list immediately
      setCustomTags(prev => prev.filter(t => t !== tagToDelete));
      
      // 2. If the user is currently filtering by this tag, reset to All
      if (activeFilter === tagToDelete) {
          setActiveFilter("All");
          setFilter("All");
          setPage(0);
      }

      // 3. Backend: Migrate all thoughts with this tag to 'General'
      try {
          await thoughtService.migrateTag(tagToDelete, "General");
          refresh(); // Re-fetch data to show updated tags
          showToast(`Deleted tag "${tagToDelete}". Entries moved to General.`, "success");
      } catch (error) {
          showToast("Failed to migrate old entries.", "error");
      }
  };

  const handleFilterChange = (newTag: string) => {
      setActiveFilter(newTag);
      setFilter(newTag); // Triggers API call in hook
      setPage(0); // Reset to first page
  };

  // Client-side search filtering on the current page of thoughts
  const displayedThoughts = thoughts.filter(t => 
      t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <ThemeToggle 
        isDark={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
      />
      
      <div>
        <h1>The Thought Wall</h1>
        <p style={{textAlign: 'center', opacity: 0.7}}>
            Powered by Spring Boot & React
        </p>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
            <Toast 
                message={toast.msg} 
                type={toast.type} 
                onClose={() => setToast(null)} 
            />
        </div>
      )}

      <ThoughtForm 
        onAdd={handleAddThought} 
        availableTags={availableTags} 
        defaultTags={defaultTags}
        onDeleteTag={handleDeleteTag}
      />

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input 
            type="text" 
            placeholder="🔍 Search thoughts on this page..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="thought-input" // Reusing our nice input style
        />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <span style={{fontSize: '0.9rem', fontWeight: 600, opacity: 0.7}}>Filter by:</span>
        <div className="filter-options">
            <button
                onClick={() => handleFilterChange("All")}
                className={`filter-chip ${activeFilter === "All" ? 'active' : ''}`}
            >
                All
            </button>
            {availableTags.map(t => (
                <button
                    key={t}
                    onClick={() => handleFilterChange(t)}
                    className={`filter-chip ${activeFilter === t ? 'active' : ''}`}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>
      
      <ThoughtList 
        thoughts={displayedThoughts} 
        loading={loading} 
        onDelete={handleDeleteThought} 
        onEdit={handleEditThought}
        onPin={togglePin}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
          <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem'}}>
              <button 
                className="tag-btn" 
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                  Previous
              </button>
              <span style={{alignSelf: 'center', fontSize: '0.9rem', opacity: 0.8}}>
                  Page {page + 1} of {totalPages}
              </span>
              <button 
                className="tag-btn" 
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                  Next
              </button>
          </div>
      )}
    </div>
  );
}

export default App;