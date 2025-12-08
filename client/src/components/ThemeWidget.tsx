import React from 'react';

interface ThemeToggleProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggleTheme }) => {
    return (
        <button 
            onClick={toggleTheme}
            style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'var(--accent-color)',
                color: '#fff',
                padding: '10px 15px',
                borderRadius: '20px',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow)'
            }}
        >
            {isDark ? '☀️' : '🌙'}
        </button>
    );
};

export default ThemeToggle;