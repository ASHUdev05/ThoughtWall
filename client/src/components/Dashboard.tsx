import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { API_BASE_URL } from "../config";

import RoomManager from "./RoomManager";
import ThoughtForm from "./ThoughtForm";
import ThoughtList from "./ThoughtList";
import KanbanBoard from "./KanbanBoard";
import { useThoughts } from "../hooks/useThoughts";
import {
  thoughtService,
  roomService,
  type User,
} from "../services/thoughtService";

interface Props {
  showToast: (msg: string, type: "success" | "error") => void;
}

// Define minimal types for Stomp to satisfy TypeScript without 'any'
interface StompMessage {
  body: string;
}

interface StompSubscription {
  id: string;
  unsubscribe: () => void;
}

interface StompClient {
  debug: (str: string) => void;
  connect: (
    headers: Record<string, unknown>,
    onConnect: (frame: unknown) => void,
    onError: (error: unknown) => void,
  ) => void;
  subscribe: (
    destination: string,
    callback: (message: StompMessage) => void,
  ) => StompSubscription;
  disconnect: (callback: () => void) => void;
}

const Dashboard: React.FC<Props> = ({ showToast }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomIdParam = searchParams.get("roomId");
  const activeRoomId = roomIdParam ? Number(roomIdParam) : undefined;

  const [roomMembers, setRoomMembers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

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
    updateThought,
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

  // --- WebSocket Logic ---

  // 1. Keep a ref to the Stomp client to manage lifecycle
  const stompClientRef = useRef<StompClient | null>(null);

  // 2. Keep a ref to the 'refresh' function.
  // This allows us to call the LATEST refresh function inside the WebSocket callback
  // WITHOUT adding 'refresh' to the useEffect dependency array (which would cause loops).
  const refreshRef = useRef(refresh);

  // Update the ref whenever 'refresh' changes (e.g. page/filter changes)
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    // Only connect if we are in a room
    if (activeRoomId) {
      const socket = new SockJS(`${API_BASE_URL}/ws`);
      // Cast to our defined interface
      const client = Stomp.over(socket) as StompClient;

      client.debug = () => {}; // Disable logs

      client.connect(
        {},
        () => {
          // Subscribe to room topic
          client.subscribe(
            `/topic/room/${activeRoomId}`,
            (message: StompMessage) => {
              if (message.body === "UPDATE") {
                // Call the function stored in the ref
                refreshRef.current();
              }
            },
          );
        },
        (err: unknown) => {
          console.error("WS Error:", err);
        },
      );

      stompClientRef.current = client;

      // Cleanup: Disconnect on unmount or room change
      return () => {
        if (client) {
          client.disconnect(() => {});
        }
      };
    }
  }, [activeRoomId]); // Only re-run if the Room ID changes

  // --- Normal Dashboard Logic ---

  const handleSwitchRoom = (id?: number) => {
    if (id) {
      setSearchParams({ roomId: id.toString() });
    } else {
      setSearchParams({});
    }
    setActiveFilter("All");
    setFilter("All");
    setPage(0);
    if (!id) setRoomMembers([]);
  };

  useEffect(() => {
    if (activeRoomId) {
      roomService
        .getMembers(activeRoomId)
        .then(setRoomMembers)
        .catch(console.error);
    }
  }, [activeRoomId]);

  const handleAddThought = async (
    content: string,
    tag: string,
    dueDate?: string,
  ) => {
    if (tag && !availableTags.includes(tag))
      setCustomTags((prev) => [...prev, tag]);
    const success = await addThought(content, tag, dueDate);
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

      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "1rem",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="thought-input"
          style={{ maxWidth: "300px" }}
        />

        <div className="filter-options">
          <button
            className={`filter-chip ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            ☰ List
          </button>
          <button
            className={`filter-chip ${viewMode === "board" ? "active" : ""}`}
            onClick={() => setViewMode("board")}
          >
            ☷ Board
          </button>
        </div>
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

      {viewMode === "list" ? (
        <>
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
      ) : (
        <KanbanBoard
          thoughts={displayedThoughts}
          availableTags={availableTags}
          onUpdateThought={updateThought}
          roomMembers={activeRoomId ? roomMembers : undefined}
        />
      )}
    </>
  );
};

export default Dashboard;
