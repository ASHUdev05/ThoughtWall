import { useState, useCallback } from 'react';
import { thoughtService, type Thought } from '../services/thoughtService';

export const useThoughts = () => {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useCallback ensures this function reference is stable
    const fetchThoughts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await thoughtService.getAll();
            setThoughts(data);
            setError(null);
            return true; // Indicate Success
        } catch (err) {
            setError('Could not load thoughts. Is the backend running?');
            return false; // Indicate Failure
        } finally {
            setLoading(false);
        }
    }, []);

    const addThought = async (content: string, tag: string) => {
        try {
            const newThought = await thoughtService.create(content, tag);
            setThoughts(prev => [newThought, ...prev]); 
            return true;
        } catch (err) {
            return false;
        }
    };

    const removeThought = async (id: number) => {
        const originalThoughts = [...thoughts];
        setThoughts(prev => prev.filter(t => t.id !== id));
        
        try {
            await thoughtService.delete(id);
            return true;
        } catch (err) {
            setThoughts(originalThoughts);
            return false;
        }
    };

    return { thoughts, loading, error, addThought, removeThought, refresh: fetchThoughts };
};