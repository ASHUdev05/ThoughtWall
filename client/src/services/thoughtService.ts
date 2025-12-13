export interface User {
  id: number;
  email: string;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  owner?: User; // Optional populated field
}

export interface Thought {
  id: number;
  content: string;
  tag?: string;
  createdAt?: string;
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

const API_BASE = "http://localhost:8081/api";

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
    const params = new URLSearchParams({ page: page.toString(), size: "5" });
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
  ): Promise<Thought> => {
    const response = await fetch(`${API_BASE}/thoughts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ content, tag, roomId }),
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
      {
        method: "PUT",
        headers: getHeaders(),
      },
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
  join: async (code: string): Promise<Room> => {
    const response = await fetch(`${API_BASE}/rooms/join/${code}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Invalid Room Code");
    return response.json();
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
  // NEW: Delete Room
  deleteRoom: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/rooms/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete room");
  },
};
