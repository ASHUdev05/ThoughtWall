import { useState, useCallback, useEffect } from "react";
import {
  thoughtService,
  type Thought,
  type User,
} from "../services/thoughtService";

export const useThoughts = (initialFilter: string = "All", roomId?: number) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState(initialFilter);

  const fetchThoughts = useCallback(
    async (currPage: number, currFilter: string, currRoomId?: number) => {
      setLoading(true);
      try {
        const data = await thoughtService.getAll(
          currPage,
          currFilter,
          currRoomId,
        );
        setThoughts(data.content);
        setTotalPages(data.totalPages);
        setError(null);
      } catch {
        setError("Could not load thoughts.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setThoughts([]);
    fetchThoughts(page, filter, roomId);
  }, [page, filter, roomId, fetchThoughts]);

  const addThought = async (content: string, tag: string, dueDate?: string) => {
    try {
      await thoughtService.create(content, tag, roomId, dueDate);
      fetchThoughts(0, filter, roomId);
      setPage(0);
      return true;
    } catch {
      return false;
    }
  };

  // NEW: Generic update method for Kanban drag-and-drop
  const updateThought = async (updatedThought: Thought) => {
    try {
      // Optimistic update: Update UI immediately
      setThoughts((prev) =>
        prev.map((t) => (t.id === updatedThought.id ? updatedThought : t)),
      );
      await thoughtService.update(updatedThought);
      return true;
    } catch {
      // Revert on failure by refetching
      fetchThoughts(page, filter, roomId);
      return false;
    }
  };

  const editThought = async (id: number, content: string, tag: string) => {
    const thoughtToUpdate = thoughts.find((t) => t.id === id);
    if (!thoughtToUpdate) return false;
    return await updateThought({ ...thoughtToUpdate, content, tag });
  };

  const togglePin = async (id: number) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return false;
    return await updateThought({ ...thought, pinned: !thought.pinned });
  };

  const toggleComplete = async (id: number) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return;
    await updateThought({ ...thought, completed: !thought.completed });
  };

  const assignUser = async (id: number, user: User | null) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return;
    await updateThought({ ...thought, assignedTo: user });
  };

  const removeThought = async (id: number) => {
    try {
      await thoughtService.delete(id);
      fetchThoughts(page, filter, roomId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    thoughts,
    loading,
    error,
    addThought,
    editThought,
    updateThought, // Exported for Kanban
    togglePin,
    removeThought,
    toggleComplete,
    assignUser,
    page,
    setPage,
    totalPages,
    setFilter,
    refresh: () => fetchThoughts(page, filter, roomId),
  };
};
