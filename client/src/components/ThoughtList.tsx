import React, { useState } from 'react';
import type { Thought, User } from '../services/thoughtService';
import './ThoughtList.css';

interface Props {
    thoughts: Thought[];
    loading: boolean;
    onDelete: (id: number) => void;
    onEdit: (id: number, content: string, tag: string) => Promise<boolean>;
    onPin: (id: number) => void;
    onToggleComplete: (id: number) => void;
    onAssign: (id: number, user: User | null) => void;
    roomMembers?: User[]; // Optional: Only present if we are in a room
}

const ThoughtList: React.FC<Props> = ({ 
    thoughts, 
    loading, 
    onDelete, 
    onEdit, 
    onPin, 
    onToggleComplete, 
    onAssign, 
    roomMembers 
}) => {
    // --- Edit State ---
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTag, setEditTag] = useState("");

    const startEditing = (thought: Thought) => {
        setEditingId(thought.id);
        setEditContent(thought.content);
        setEditTag(thought.tag || "General");
    };

    const saveEdit = async (id: number) => {
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
                    style={{ 
                        borderLeft: thought.pinned ? '4px solid var(--accent-color)' : undefined,
                        opacity: thought.completed ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                    }}
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
                                <button className="tag-btn" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        /* --- VIEW MODE --- */
                        <>
                            {/* Checkbox Column */}
                            <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginRight: '1rem', paddingTop:'4px'}}>
                                <input 
                                    type="checkbox" 
                                    checked={thought.completed} 
                                    onChange={() => onToggleComplete(thought.id)}
                                    title="Mark as done"
                                    style={{
                                        width: '20px', 
                                        height: '20px', 
                                        cursor:'pointer', 
                                        accentColor: 'var(--accent-color)'
                                    }}
                                />
                            </div>

                            {/* Content Column */}
                            <div className="thought-main">
                                <div style={{display:'flex', alignItems:'center', gap: '8px', marginBottom: '8px', flexWrap:'wrap'}}>
                                    <span className="thought-tag">{thought.tag || 'General'}</span>
                                    {thought.pinned && <span title="Pinned" style={{fontSize: '0.9rem'}}>📌</span>}
                                    
                                    {/* Assignment Dropdown (Only if in a Room) */}
                                    {roomMembers && (
                                        <select 
                                            style={{
                                                padding: '2px 8px', 
                                                borderRadius:'12px', 
                                                border:'1px solid var(--border-color)', 
                                                fontSize: '0.8rem', 
                                                background: 'var(--bg-color)', 
                                                color: 'var(--text-color)',
                                                cursor: 'pointer'
                                            }}
                                            value={thought.assignedTo?.id || ""}
                                            onChange={(e) => {
                                                const uid = Number(e.target.value);
                                                const u = roomMembers.find(m => m.id === uid) || null;
                                                onAssign(thought.id, u);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="">Unassigned</option>
                                            {roomMembers.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.email}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                
                                <p 
                                    className="thought-content" 
                                    style={{
                                        textDecoration: thought.completed ? 'line-through' : 'none',
                                        color: thought.completed ? 'var(--text-color-muted)' : 'var(--text-color)'
                                    }}
                                >
                                    {thought.content}
                                </p>
                                
                                {/* Updated Date & Time Display */}
                                <small className="thought-date">
                                    {thought.createdAt 
                                        ? new Date(thought.createdAt).toLocaleDateString() + ' • ' + new Date(thought.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                        : ''}
                                </small>
                            </div>

                            {/* Actions Column */}
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