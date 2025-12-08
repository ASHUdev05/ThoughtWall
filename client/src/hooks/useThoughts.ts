import { useState, useCallback, useEffect } from 'react';
import { thoughtService, type Thought } from '../services/thoughtService';

export const useThoughts = (initialFilter: string = "All") => {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState(initialFilter);

    const fetchThoughts = useCallback(async (currentPage: number, currentFilter: string) => {
        setLoading(true);
        try {
            const data = await thoughtService.getAll(currentPage, currentFilter);
            setThoughts(data.content);
            setTotalPages(data.totalPages);
            setError(null);
        } catch (err) {
            setError('Could not load thoughts.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThoughts(page, filter);
    }, [page, filter, fetchThoughts]);

    const addThought = async (content: string, tag: string) => {
        try {
            await thoughtService.create(content, tag);
            fetchThoughts(0, filter); 
            setPage(0);
            return true;
        } catch (err) {
            return false;
        }
    };

    const editThought = async (id: number, content: string, tag: string) => {
        const thoughtToUpdate = thoughts.find(t => t.id === id);
        if(!thoughtToUpdate) return false;

        try {
            const updated = await thoughtService.update({ ...thoughtToUpdate, content, tag });
            setThoughts(prev => prev.map(t => t.id === id ? updated : t));
            return true;
        } catch (err) {
            return false;
        }
    };

    const togglePin = async (id: number) => {
        const thoughtToUpdate = thoughts.find(t => t.id === id);
        if(!thoughtToUpdate) return false;

        try {
            setThoughts(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
            await thoughtService.update({ ...thoughtToUpdate, pinned: !thoughtToUpdate.pinned });
            fetchThoughts(page, filter);
            return true;
        } catch (err) {
            fetchThoughts(page, filter);
            return false;
        }
    }

    const removeThought = async (id: number) => {
        try {
            await thoughtService.delete(id);
            fetchThoughts(page, filter);
            return true;
        } catch (err) {
            return false;
        }
    };

    return { 
        thoughts, loading, error, 
        addThought, editThought, togglePin, removeThought, 
        page, setPage, totalPages, setFilter,
        refresh: () => fetchThoughts(page, filter) // <--- ENSURE THIS IS ADDED
    };
};