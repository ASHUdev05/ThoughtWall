import React, { useState } from 'react';
import type { Thought } from '../services/thoughtService';
import './ThoughtList.css';

interface Props {
    thoughts: Thought[];
    loading: boolean;
    onDelete: (id: number) => void;
    onEdit: (id: number, content: string, tag: string) => Promise<boolean>;
    onPin: (id: number) => void;
}

const ThoughtList: React.FC<Props> = ({ thoughts, loading, onDelete, onEdit, onPin }) => {
    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTag, setEditTag] = useState("");

    // Initialize edit mode with current values
    const startEditing = (thought: Thought) => {
        setEditingId(thought.id);
        setEditContent(thought.content);
        setEditTag(thought.tag || "General");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent("");
        setEditTag("");
    };

    const saveEdit = async (id: number) => {
        // Prevent saving empty content
        if (!editContent.trim()) return;
        
        const success = await onEdit(id, editContent, editTag);
        if (success) {
            setEditingId(null);
        }
    };

    if (loading && thoughts.length === 0) {
        return <div className="loading-spinner">Loading thoughts...</div>;
    }

    if (!loading && thoughts.length === 0) {
        return <div style={{textAlign: 'center', opacity: 0.6, marginTop: '2rem'}}>No thoughts yet. Start writing!</div>;
    }

    return (
        <div className="thought-list">
            {thoughts.map(thought => (
                <div 
                    key={thought.id} 
                    className="thought-card" 
                    // Visual cue for pinned items
                    style={thought.pinned ? { borderLeft: '4px solid var(--accent-color)' } : {}}
                >
                    {editingId === thought.id ? (
                        /* --- EDIT MODE --- */
                        <div className="thought-main" style={{ width: '100%' }}>
                            <input 
                                value={editTag} 
                                onChange={(e) => setEditTag(e.target.value)}
                                className="thought-input"
                                style={{ marginBottom: '0.5rem', padding: '8px', fontSize: '0.9rem' }}
                                placeholder="Tag"
                            />
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="thought-input"
                                rows={3}
                                style={{ fontFamily: 'inherit', resize: 'vertical' }}
                            />
                            <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                                <button className="tag-btn active" onClick={() => saveEdit(thought.id)}>Save</button>
                                <button className="tag-btn" onClick={cancelEditing}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        /* --- VIEW MODE --- */
                        <>
                            <div className="thought-main">
                                <div style={{display:'flex', alignItems:'center', gap: '8px', marginBottom: '8px'}}>
                                    <span className="thought-tag">{thought.tag || 'General'}</span>
                                    {thought.pinned && <span title="Pinned" style={{fontSize: '0.9rem'}}>📌</span>}
                                </div>
                                
                                <p className="thought-content">{thought.content}</p>
                                
                                <small className="thought-date">
                                    {thought.createdAt 
                                        ? new Date(thought.createdAt).toLocaleDateString() + ' • ' + new Date(thought.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : ''}
                                </small>
                            </div>

                            <div className="thought-actions" style={{display:'flex', gap: '4px', alignItems: 'flex-start'}}>
                                <button 
                                    className="action-btn pin-btn"
                                    onClick={() => onPin(thought.id)}
                                    title={thought.pinned ? "Unpin" : "Pin"}
                                    style={{ opacity: thought.pinned ? 1 : 0.4 }}
                                >
                                    📌
                                </button>
                                <button 
                                    className="action-btn edit-btn"
                                    onClick={() => startEditing(thought)}
                                    title="Edit"
                                >
                                    ✎
                                </button>
                                <button 
                                    className="action-btn delete-btn" 
                                    onClick={() => onDelete(thought.id)}
                                    title="Delete"
                                >
                                    ×
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ThoughtList;