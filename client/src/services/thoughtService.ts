export interface Thought {
        id: number;
        content: string;
        tag?: string; // Added tag (optional to avoid breaking old data)
        created_at?: string; // Optional timestamp
    }

    const API_BASE_URL = 'http://localhost:8081/api/thoughts';

    export const thoughtService = {
        // GET all thoughts
        getAll: async (): Promise<Thought[]> => {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error('Failed to fetch thoughts');
            return response.json();
        },

        // POST a new thought
        create: async (content: string, tag: string): Promise<Thought> => {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, tag }),
            });
            if (!response.ok) throw new Error('Failed to create thought');
            return response.json();
        },

        // DELETE a thought
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete thought');
        }
    };