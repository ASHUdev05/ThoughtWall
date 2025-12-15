import { API_BASE_URL } from "../config";
import type { Room } from "./thoughtService";

export interface AssignedTask {
  id: number;
  content: string;
  roomName: string;
  completed: boolean;
}

export interface UserProfile {
  email: string;
  ownedRooms: Room[];
  joinedRooms: Room[];
  assignedTasks: AssignedTask[];
}

const API_BASE = `${API_BASE_URL}/api/users`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE}/profile`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  },

  deleteAccount: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/me`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete account");
  },

  getUser: () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      // Decode JWT Payload (middle part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding token", e);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
