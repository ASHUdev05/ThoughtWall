import { API_BASE_URL } from "../config";

export interface User {
  id: number;
  email: string;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  owner?: User;
}

export interface RoomRequest {
  id: number;
  user: User;
  requestedAt: string;
}

export interface Thought {
  id: number;
  content: string;
  tag?: string;
  createdAt?: string;
  dueDate?: string;
  pinned: boolean;
  completed: boolean;
  assignedTo?: User | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const API_BASE = `${API_BASE_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const thoughtService = {
  getAll: async (
    page: number = 0,
    tag: string = "All",
    roomId?: number,
  ): Promise<PageResponse<Thought>> => {
    const params = new URLSearchParams({ page: page.toString(), size: "20" });
    if (tag && tag !== "All") params.append("tag", tag);
    if (roomId) params.append("roomId", roomId.toString());

    const response = await fetch(`${API_BASE}/thoughts?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch thoughts");
    return response.json();
  },

  create: async (
    content: string,
    tag: string,
    roomId?: number,
    dueDate?: string,
  ): Promise<Thought> => {
    const response = await fetch(`${API_BASE}/thoughts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, tag, roomId, dueDate }),
    });
    if (!response.ok) throw new Error("Failed to create thought");
    return response.json();
  },

  update: async (thought: Thought): Promise<Thought> => {
    const response = await fetch(`${API_BASE}/thoughts/${thought.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(thought),
    });
    if (!response.ok) throw new Error("Failed to update thought");
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/thoughts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete thought");
  },

  migrateTag: async (
    oldTag: string,
    newTag: string = "General",
  ): Promise<void> => {
    const params = new URLSearchParams({ oldTag, newTag });
    const response = await fetch(
      `${API_BASE}/thoughts/tags/migrate?${params.toString()}`,
      { method: "PUT", headers: getHeaders() },
    );
    if (!response.ok) throw new Error("Failed to migrate tags");
  },
};

export const roomService = {
  create: async (name: string): Promise<Room> => {
    const response = await fetch(`${API_BASE}/rooms`, {
      method: "POST",
      headers: getHeaders(),
      body: name,
    });
    return response.json();
  },
  join: async (code: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/rooms/join/${code}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to join room");
    }
    return response.json(); // Returns message
  },
  getMyRooms: async (): Promise<Room[]> => {
    const response = await fetch(`${API_BASE}/rooms`, {
      headers: getHeaders(),
    });
    return response.json();
  },
  getMembers: async (roomId: number): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/members`, {
      headers: getHeaders(),
    });
    return response.json();
  },
  deleteRoom: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/rooms/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete room");
  },
  // NEW: Moderation Methods
  getRequests: async (roomId: number): Promise<RoomRequest[]> => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/requests`, {
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch requests");
    return response.json();
  },
  approveRequest: async (roomId: number, requestId: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/requests/${requestId}/approve`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to approve request");
  },
  rejectRequest: async (roomId: number, requestId: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/requests/${requestId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to reject request");
  },
  kickUser: async (roomId: number, userId: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/members/${userId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to kick user");
  }
};