export interface Thought {
    id: number;
    content: string;
    tag?: string;
    createdAt?: string;
    pinned: boolean; // Added
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

const API_BASE_URL = 'http://localhost:8081/api/thoughts';

export const thoughtService = {
    getAll: async (page: number = 0, tag: string = "All"): Promise<PageResponse<Thought>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: '5',
        });
        
        if (tag && tag !== "All") {
            params.append('tag', tag);
        }

        const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch thoughts');
        return response.json();
    },

    create: async (content: string, tag: string): Promise<Thought> => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, tag, pinned: false }),
        });
        if (!response.ok) throw new Error('Failed to create thought');
        return response.json();
    },

    // Handles Content updates AND Pin toggling
    update: async (thought: Thought): Promise<Thought> => {
        const response = await fetch(`${API_BASE_URL}/${thought.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(thought),
        });
        if (!response.ok) throw new Error('Failed to update thought');
        return response.json();
    },

    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete thought');
    },

    migrateTag: async (oldTag: string, newTag: string = "General"): Promise<void> => {
        const params = new URLSearchParams({ oldTag, newTag });
        const response = await fetch(`${API_BASE_URL}/tags/migrate?${params.toString()}`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to migrate tags');
    }
};