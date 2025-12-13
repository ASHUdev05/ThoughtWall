// Define the shape of the error to ensure type safety
export interface ApiError {
  message: string;
  status?: number;
}

const API_BASE_URL = "http://localhost:8081";

// Explicitly type the return Promise.
// If your API returned a JSON object, you would replace <string> with <YourInterface>
export const getHelloMessage = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hello`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    // In TypeScript, 'error' in a catch block is of type 'unknown'
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unexpected error occurred");
    }
  }
};
