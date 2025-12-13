import React, { useState } from "react";
import "./ThoughtForm.css";

interface Props {
  onAdd: (content: string, tag: string) => Promise<boolean>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const finalTag = customTagInput.trim() || selectedTag;

    if (await onAdd(text, finalTag)) {
      setText("");
      setCustomTagInput("");
      setSelectedTag("General");
    }
  };

  return (
    <form className="thought-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          className="thought-input"
          type="text"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
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
                        e.stopPropagation(); // Prevent selection when deleting
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
        <button type="submit" className="submit-btn">
          Post
        </button>
      </div>
    </form>
  );
};

export default ThoughtForm;
