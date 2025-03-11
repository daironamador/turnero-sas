
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtime<T>(
  table: string,
  initialQuery?: () => Promise<T[]>,
  filter?: (data: T) => boolean
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        if (initialQuery) {
          const initialData = await initialQuery();
          if (isMounted) {
            setData(filter ? initialData.filter(filter) : initialData);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Set up real-time listener
    const handleRealtimeUpdate = () => {
      loadData();
    };

    window.addEventListener(`${table}-updated`, handleRealtimeUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(`${table}-updated`, handleRealtimeUpdate);
    };
  }, [table, initialQuery]);

  return { data, loading, error, refresh: () => {} };
}
