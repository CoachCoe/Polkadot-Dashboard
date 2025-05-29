import { useState, useEffect } from 'react';
import { homeService, type HomeData } from '@/services/homeService';

interface UseHomeResult {
  data: HomeData | null;
  isLoading: boolean;
  error: string | null;
}

export function useHome(address: string): UseHomeResult {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await homeService.getHomeData(address);
        setData(data);
      } catch (err) {
        console.error('Error loading home data:', err);
        setError('Failed to load home data');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [address]);

  return { data, isLoading, error };
} 