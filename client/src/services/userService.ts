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

const API_BASE = 'http://localhost:8081/api/users';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await fetch(`${API_BASE}/profile`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Failed to fetch profile");
        return response.json();
    },

    deleteAccount: async (): Promise<void> => {
        const response = await fetch(`${API_BASE}/me`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Failed to delete account");
    }
};