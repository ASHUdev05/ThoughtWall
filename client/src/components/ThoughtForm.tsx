import React, { useState } from 'react';
    import './ThoughtForm.css';

    interface Props {
        // Updated signature to include tag
        onAdd: (content: string, tag: string) => Promise<boolean>;
    }

    const ThoughtForm: React.FC<Props> = ({ onAdd }) => {
        const [text, setText] = useState("");
        const [tag, setTag] = useState("General"); // Default tag

        const tags = ["General", "Idea", "To-Do", "Journal", "Dream"];

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!text.trim()) return;
            
            const success = await onAdd(text, tag);
            if (success) {
                setText("");
                setTag("General");
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
                        {tags.map(t => (
                            <button 
                                key={t}
                                type="button" 
                                className={`tag-btn ${tag === t ? 'active' : ''}`}
                                onClick={() => setTag(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button type="submit" className="submit-btn">Post</button>
                </div>
            </form>
        );
    };

    export default ThoughtForm;