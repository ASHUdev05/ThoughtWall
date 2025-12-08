import { useState, useEffect } from 'react';
import './App.css';
import ThemeToggle from './components/ThemeWidget';
import ThoughtForm from './components/ThoughtForm';
import ThoughtList from './components/ThoughtList';
import { useThoughts } from './hooks/useThoughts';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { thoughts, loading, addThought, removeThought } = useThoughts();

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

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

      <ThoughtForm onAdd={addThought} />
      
      <ThoughtList 
        thoughts={thoughts} 
        loading={loading} 
        onDelete={removeThought} 
      />
    </div>
  );
}

export default App;