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
    fetchThoughts(page, filter, roomId);
  }, [page, filter, roomId, fetchThoughts]);

  const addThought = async (content: string, tag: string) => {
    try {
      await thoughtService.create(content, tag, roomId);
      fetchThoughts(0, filter, roomId);
      setPage(0);
      return true;
    } catch {
      return false;
    }
  };

  const editThought = async (id: number, content: string, tag: string) => {
    const thoughtToUpdate = thoughts.find((t) => t.id === id);
    if (!thoughtToUpdate) return false;
    try {
      const updated = await thoughtService.update({
        ...thoughtToUpdate,
        content,
        tag,
      });
      setThoughts((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return true;
    } catch {
      return false;
    }
  };

  const togglePin = async (id: number) => {
    const thoughtToUpdate = thoughts.find((t) => t.id === id);
    if (!thoughtToUpdate) return false;
    try {
      setThoughts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
      );
      await thoughtService.update({
        ...thoughtToUpdate,
        pinned: !thoughtToUpdate.pinned,
      });
      fetchThoughts(page, filter, roomId);
      return true;
    } catch {
      fetchThoughts(page, filter, roomId);
      return false;
    }
  };

  const toggleComplete = async (id: number) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return;
    try {
      // Optimistic update
      setThoughts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
      await thoughtService.update({
        ...thought,
        completed: !thought.completed,
      });
      fetchThoughts(page, filter, roomId); // Refresh to sort
    } catch {
      fetchThoughts(page, filter, roomId);
    }
  };

  const assignUser = async (id: number, user: User | null) => {
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return;
    try {
      await thoughtService.update({ ...thought, assignedTo: user });
      fetchThoughts(page, filter, roomId);
    } catch (err) {
      console.error("Failed to assign task:", err);
      setError("Could not assign task.");
    }
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
