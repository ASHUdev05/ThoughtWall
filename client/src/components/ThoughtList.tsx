import React from 'react';
    import type { Thought } from '../services/thoughtService';
    import './ThoughtList.css';

    interface Props {
        thoughts: Thought[];
        loading: boolean;
        onDelete: (id: number) => void;
    }

    const ThoughtList: React.FC<Props> = ({ thoughts, loading, onDelete }) => {
        if (loading && thoughts.length === 0) {
            return <div className="loading-spinner">Loading thoughts...</div>;
        }

        if (thoughts.length === 0) {
            return <div style={{textAlign: 'center', opacity: 0.6}}>No thoughts yet. Be the first!</div>;
        }

        return (
            <div className="thought-list">
                {thoughts.map(thought => (
                    <div key={thought.id} className="thought-card">
                        <div className="thought-main">
                             {/* Tag Badge */}
                            <span className="thought-tag">{thought.tag || 'General'}</span>
                            <p className="thought-content">{thought.content}</p>
                        </div>
                        <button 
                            className="delete-btn" 
                            onClick={() => onDelete(thought.id)}
                            title="Delete"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    export default ThoughtList;