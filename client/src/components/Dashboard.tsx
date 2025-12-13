import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import RoomManager from "./RoomManager";
import ThoughtForm from "./ThoughtForm";
import ThoughtList from "./ThoughtList";
import { useThoughts } from "../hooks/useThoughts";
import {
  thoughtService,
  roomService,
  type User,
} from "../services/thoughtService";

interface Props {
  showToast: (msg: string, type: "success" | "error") => void;
}

const Dashboard: React.FC<Props> = ({ showToast }) => {
  // Use URL params for Room ID instead of local state
  const [searchParams, setSearchParams] = useSearchParams();
  const roomIdParam = searchParams.get("roomId");
  const activeRoomId = roomIdParam ? Number(roomIdParam) : undefined;

  const [roomMembers, setRoomMembers] = useState<User[]>([]);

  const defaultTags = ["General", "Idea", "To-Do", "Journal", "Dream"];
  const [customTags, setCustomTags] = useState<string[]>([]);
  const availableTags = [...defaultTags, ...customTags];

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    thoughts,
    loading,
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
    refresh,
  } = useThoughts("All", activeRoomId);

  // Handle Room Switching via URL
  const handleSwitchRoom = (id?: number) => {
    if (id) {
      setSearchParams({ roomId: id.toString() });
    } else {
      setSearchParams({});
    }
    // Reset local UI states
    setActiveFilter("All");
    setFilter("All");
    setPage(0);
    if (!id) setRoomMembers([]);
  };

  // Fetch members when activeRoomId changes
  useEffect(() => {
    if (activeRoomId) {
      roomService
        .getMembers(activeRoomId)
        .then(setRoomMembers)
        .catch(console.error);
    }
  }, [activeRoomId]);

  const handleAddThought = async (content: string, tag: string) => {
    if (tag && !availableTags.includes(tag))
      setCustomTags((prev) => [...prev, tag]);
    const success = await addThought(content, tag);
    if (success) showToast("Thought captured!", "success");
    return success;
  };

  const handleEditThought = async (
    id: number,
    content: string,
    tag: string,
  ) => {
    if (tag && !availableTags.includes(tag))
      setCustomTags((prev) => [...prev, tag]);
    const success = await editThought(id, content, tag);
    if (success) showToast("Thought updated!", "success");
    return success;
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tagToDelete));
    if (activeFilter === tagToDelete) {
      setActiveFilter("All");
      setFilter("All");
      setPage(0);
    }
    try {
      await thoughtService.migrateTag(tagToDelete, "General");
      refresh();
      showToast("Tag deleted.", "success");
    } catch {
      showToast("Failed to delete tag.", "error");
    }
  };

  const displayedThoughts = thoughts.filter((t) =>
    t.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <RoomManager
        activeRoomId={activeRoomId}
        onRoomSelect={handleSwitchRoom}
      />

      <ThoughtForm
        onAdd={handleAddThought}
        availableTags={availableTags}
        defaultTags={defaultTags}
        onDeleteTag={handleDeleteTag}
      />

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="🔍 Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="thought-input"
        />
      </div>

      <div className="filter-bar">
        <div className="filter-options">
          <button
            onClick={() => {
              setActiveFilter("All");
              setFilter("All");
              setPage(0);
            }}
            className={`filter-chip ${activeFilter === "All" ? "active" : ""}`}
          >
            All
          </button>
          {availableTags.map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveFilter(t);
                setFilter(t);
                setPage(0);
              }}
              className={`filter-chip ${activeFilter === t ? "active" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <ThoughtList
        thoughts={displayedThoughts}
        loading={loading}
        onDelete={async (id) => {
          if (await removeThought(id)) showToast("Deleted", "success");
        }}
        onEdit={handleEditThought}
        onPin={togglePin}
        onToggleComplete={toggleComplete}
        onAssign={assignUser}
        roomMembers={activeRoomId ? roomMembers : undefined}
      />

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <button
            className="tag-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            className="tag-btn"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default Dashboard;
