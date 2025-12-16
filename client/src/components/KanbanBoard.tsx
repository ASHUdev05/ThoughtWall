import React, { useState } from "react";
import type { Thought, User } from "../services/thoughtService";
import ReactMarkdown from "react-markdown";
import "./ThoughtList.css";

interface Props {
  thoughts: Thought[];
  availableTags: string[];
  onUpdateThought: (thought: Thought) => Promise<boolean | void>;
  roomMembers?: User[];
}

// Helper to generate consistent pastel colors from strings
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 60%, 85%)`; // Pastel HSL
};

const KanbanBoard: React.FC<Props> = ({
  thoughts,
  availableTags,
  onUpdateThought,
}) => {
  const [draggedThoughtId, setDraggedThoughtId] = useState<number | null>(null);

  const columns: Record<string, Thought[]> = {};
  availableTags.forEach((tag) => (columns[tag] = []));
  columns["Other"] = [];

  thoughts.forEach((t) => {
    const tag = t.tag && availableTags.includes(t.tag) ? t.tag : "Other";
    if (columns[tag]) columns[tag].push(t);
    else columns["Other"].push(t);
  });

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedThoughtId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetTag: string) => {
    e.preventDefault();
    if (draggedThoughtId === null) return;

    const thought = thoughts.find((t) => t.id === draggedThoughtId);
    if (thought && thought.tag !== targetTag) {
      const updated = {
        ...thought,
        tag: targetTag === "Other" ? "General" : targetTag,
      };
      await onUpdateThought(updated);
    }
    setDraggedThoughtId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        overflowX: "auto",
        padding: "1rem",
        height: "calc(100vh - 200px)",
      }}
    >
      {Object.entries(columns).map(([tag, items]) => {
        const headerColor = stringToColor(tag);
        
        return (
        <div
          key={tag}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, tag)}
          style={{
            minWidth: "320px",
            background: "var(--card-bg)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            overflow: "hidden"
          }}
        >
          <div style={{
              background: headerColor, 
              padding: "1rem", 
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              color: "#333",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between"
          }}>
            <span>{tag}</span>
            <span style={{ background: "rgba(255,255,255,0.6)", borderRadius: "12px", padding: "2px 8px", fontSize: "0.8rem" }}>
              {items.length}
            </span>
          </div>
          
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              padding: "1rem"
            }}
          >
            {items.map((thought) => (
              <div
                key={thought.id}
                draggable
                onDragStart={(e) => handleDragStart(e, thought.id)}
                className="thought-card"
                style={{
                  cursor: "grab",
                  margin: 0,
                  opacity: thought.completed ? 0.6 : 1,
                  borderLeft: thought.pinned ? "4px solid var(--accent-color)" : `4px solid ${headerColor}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ fontSize: "0.9rem", maxHeight: "120px", overflow: "hidden", position: 'relative' }}>
                  <ReactMarkdown>{thought.content}</ReactMarkdown>
                  {/* Fade out effect for long text */}
                  <div style={{position:'absolute', bottom:0, left:0, right:0, height:'20px', background:'linear-gradient(transparent, var(--card-bg))'}}></div>
                </div>
                
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'8px', alignItems:'center'}}>
                    {thought.assignedTo ? (
                        <div style={{fontSize:'0.75rem', background:'var(--border-color)', padding:'2px 6px', borderRadius:'4px'}} title={thought.assignedTo.email}>
                            👤 {thought.assignedTo.email.split('@')[0]}
                        </div>
                    ) : <div />}
                    
                    {thought.dueDate && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-color-muted)" }}>
                        📅 {new Date(thought.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )})}
    </div>
  );
};

export default KanbanBoard;