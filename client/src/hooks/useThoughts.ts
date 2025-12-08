import { useState, useEffect } from 'react';
import { thoughtService, type Thought } from '../services/thoughtService';

export const useThoughts = () => {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchThoughts = async () => {
        setLoading(true);
        try {
            const data = await thoughtService.getAll();
            setThoughts(data);
            setError(null);
        } catch (err) {
            setError('Could not load thoughts. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const addThought = async (content: string) => {
        try {
            const newThought = await thoughtService.create(content);
            setThoughts(prev => [...prev, newThought]);
            return true;
        } catch (err) {
            alert("Failed to save thought");
            return false;
        }
    };

    const removeThought = async (id: number) => {
        // Optimistic update: Remove immediately from UI
        setThoughts(prev => prev.filter(t => t.id !== id));
        try {
            await thoughtService.delete(id);
        } catch (err) {
            // Revert if failed
            alert("Failed to delete");
            fetchThoughts(); 
        }
    };

    // Load initial data
    useEffect(() => {
        fetchThoughts();
    }, []);

    return { thoughts, loading, error, addThought, removeThought, refresh: fetchThoughts };
};