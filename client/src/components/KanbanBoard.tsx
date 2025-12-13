import React, { useState } from "react";
import type { Thought, User } from "../services/thoughtService";
import ReactMarkdown from "react-markdown";
import "./ThoughtList.css"; // Reuse basic styles

interface Props {
  thoughts: Thought[];
  availableTags: string[];
  // FIX: Allow Promise<boolean> to match the hook's return type
  onUpdateThought: (thought: Thought) => Promise<boolean | void>;
  roomMembers?: User[];
}

const KanbanBoard: React.FC<Props> = ({
  thoughts,
  availableTags,
  onUpdateThought,
}) => {
  const [draggedThoughtId, setDraggedThoughtId] = useState<number | null>(null);

  // Group thoughts by tag
  const columns: Record<string, Thought[]> = {};
  availableTags.forEach((tag) => (columns[tag] = []));
  // Add an "Other" column for tags not in availableTags
  columns["Other"] = [];

  thoughts.forEach((t) => {
    const tag = t.tag && availableTags.includes(t.tag) ? t.tag : "Other";
    // If tag is not in availableTags (and not caught by above), put in Other
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
        gap: "1rem",
        overflowX: "auto",
        padding: "1rem",
        height: "calc(100vh - 200px)",
      }}
    >
      {Object.entries(columns).map(([tag, items]) => (
        <div
          key={tag}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, tag)}
          style={{
            minWidth: "300px",
            background: "var(--card-bg)",
            borderRadius: "8px",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--border-color)",
          }}
        >
          <h3
            style={{
              marginBottom: "1rem",
              borderBottom: "2px solid var(--primary-color)",
              paddingBottom: "0.5rem",
            }}
          >
            {tag}{" "}
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              ({items.length})
            </span>
          </h3>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
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
                  borderLeft: thought.pinned
                    ? "4px solid var(--accent-color)"
                    : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    maxHeight: "100px",
                    overflow: "hidden",
                  }}
                >
                  <ReactMarkdown>{thought.content}</ReactMarkdown>
                </div>
                {thought.dueDate && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      marginTop: "4px",
                      color: "var(--text-color-muted)",
                    }}
                  >
                    📅 {new Date(thought.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
