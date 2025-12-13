import { API_BASE_URL } from "../config";

// Define the shape of the error to ensure type safety
export interface ApiError {
  message: string;
  status?: number;
}

// Explicitly type the return Promise.
export const getHelloMessage = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hello`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};
