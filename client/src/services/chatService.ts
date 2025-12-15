import { API_BASE_URL } from "../config";

export interface ChatMessage {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    email: string;
  };
  timestamp: string;
}

export const chatService = {
  getHistory: async (roomId: string): Promise<ChatMessage[]> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${roomId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    return response.json();
  },
};
