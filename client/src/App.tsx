import { useState, useEffect } from 'react';
import './App.css';
import ThemeToggle from './components/ThemeWidget';
import ThoughtForm from './components/ThoughtForm';
import ThoughtList from './components/ThoughtList';
import Toast from './components/Toast'; 
import { useThoughts } from './hooks/useThoughts';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filter, setFilter] = useState("All");
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const { thoughts, loading, addThought, removeThought, refresh } = useThoughts();

  const tags = ["All", "General", "Idea", "To-Do", "Journal", "Dream"];

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Initial Data Load with Toast on Failure
  useEffect(() => {
    const init = async () => {
        const success = await refresh();
        if (!success) {
            setToast({ msg: "Cannot connect to server. Is Backend running?", type: "error" });
        }
    };
    init();
  }, [refresh]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  const handleAddThought = async (content: string, tag: string) => {
    const success = await addThought(content, tag);
    if (success) {
        showToast("Thought captured!", "success");
        return true;
    } else {
        showToast("Failed to save. Backend might be down.", "error");
        return false;
    }
  };

  const handleDeleteThought = async (id: number) => {
    const success = await removeThought(id);
    if (success) {
        showToast("Thought removed.", "success");
    } else {
        showToast("Could not delete. Backend issue?", "error");
    }
  };

  const displayedThoughts = filter === "All" 
    ? thoughts 
    : thoughts.filter(t => t.tag === filter);

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

      <ThoughtForm onAdd={handleAddThought} />

      <div className="filter-bar">
        <span style={{fontSize: '0.9rem', fontWeight: 600, opacity: 0.7}}>Filter by:</span>
        <div className="filter-options">
            {tags.map(t => (
                <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`filter-chip ${filter === t ? 'active' : ''}`}
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
      />
    </div>
  );
}

export default App;