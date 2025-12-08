import React, { useState } from 'react';
import './ThoughtForm.css';

interface Props {
    onAdd: (content: string) => Promise<boolean>;
}

const ThoughtForm: React.FC<Props> = ({ onAdd }) => {
    const [text, setText] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        
        const success = await onAdd(text);
        if (success) setText("");
    };

    return (
        <form className="thought-form" onSubmit={handleSubmit}>
            <input 
                className="thought-input"
                type="text" 
                placeholder="What's on your mind?" 
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="submit-btn">Post</button>
        </form>
    );
};

export default ThoughtForm;