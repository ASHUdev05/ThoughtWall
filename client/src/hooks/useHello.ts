import { useState, useEffect } from "react";
import { getHelloMessage } from "../services/helloService";

// Define the shape of the hook's return value
interface UseHelloResult {
  data: string | null;
  loading: boolean;
  error: string | null;
}

export const useHello = (): UseHelloResult => {
  // We use generics <string | null> to tell TS what state to expect
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getHelloMessage();
        setData(result);
      } catch (err) {
        // Safe error handling for TypeScript
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
