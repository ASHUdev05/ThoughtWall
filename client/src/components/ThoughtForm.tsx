import React, { useState } from "react";
import "./ThoughtForm.css";

interface Props {
  onAdd: (content: string, tag: string, dueDate?: string) => Promise<boolean>;
  availableTags: string[];
  defaultTags: string[];
  onDeleteTag: (tag: string) => void;
}

const ThoughtForm: React.FC<Props> = ({
  onAdd,
  availableTags,
  defaultTags,
  onDeleteTag,
}) => {
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState("General");
  const [customTagInput, setCustomTagInput] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const finalTag = customTagInput.trim() || selectedTag;

    // Send date as ISO string if present
    const isoDate = dueDate ? new Date(dueDate).toISOString() : undefined;

    if (await onAdd(text, finalTag, isoDate)) {
      setText("");
      setCustomTagInput("");
      setSelectedTag("General");
      setDueDate("");
    }
  };

  return (
    <form className="thought-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <textarea
          className="thought-input"
          placeholder="What's on your mind? (Markdown supported)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div className="controls-group">
        <div className="tag-selector">
          {availableTags.map((t) => {
            const isCustom = !defaultTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                className={`tag-btn ${selectedTag === t && !customTagInput ? "active" : ""}`}
                onClick={() => {
                  setSelectedTag(t);
                  setCustomTagInput("");
                }}
              >
                <span className="tag-btn-content">
                  {t}
                  {isCustom && (
                    <span
                      className="tag-delete-x"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTag(t);
                      }}
                      title="Delete tag"
                    >
                      ×
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          <input
            type="text"
            className={`tag-input-pill ${customTagInput ? "active" : ""}`}
            placeholder="+ New"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="datetime-local"
            className="thought-input"
            style={{ width: "auto", padding: "8px" }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            title="Due Date"
          />
          <button type="submit" className="submit-btn">
            Post
          </button>
        </div>
      </div>
    </form>
  );
};

export default ThoughtForm;
