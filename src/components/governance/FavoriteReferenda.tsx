'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Referendum } from '@/services/governance';
import { governanceService } from '@/services/governance';
import { formatDistanceToNow } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteReferendaStore {
  favorites: Set<number>;
  addFavorite: (index: number) => void;
  removeFavorite: (index: number) => void;
  hasFavorite: (index: number) => boolean;
}

const useFavoriteReferenda = create<FavoriteReferendaStore>()(
  persist(
    (set, get) => ({
      favorites: new Set<number>(),
      addFavorite: (index: number) =>
        set((state) => {
          const newFavorites = new Set(state.favorites);
          newFavorites.add(index);
          return { favorites: newFavorites };
        }),
      removeFavorite: (index: number) =>
        set((state) => {
          const newFavorites = new Set(state.favorites);
          newFavorites.delete(index);
          return { favorites: newFavorites };
        }),
      hasFavorite: (index: number) => get().favorites.has(index),
    }),
    {
      name: 'favorite-referenda',
      partialize: (state) => ({
        favorites: Array.from(state.favorites)
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        favorites: new Set(persistedState.favorites)
      })
    }
  )
);

export function FavoriteReferenda() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [referenda, setReferenda] = useState<Referendum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { favorites, addFavorite, removeFavorite } = useFavoriteReferenda();

  useEffect(() => {
    if (session?.user?.address) {
      loadFavoriteReferenda();
    }
  }, [favorites, session?.user?.address]);

  const loadFavoriteReferenda = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allReferenda = await governanceService.getReferenda();
      const favoriteReferenda = allReferenda.filter((ref) =>
        favorites.has(ref.index)
      );
      setReferenda(favoriteReferenda);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load favorite referenda';
      setError(message);
      showToast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (index: number) => {
    try {
      if (favorites.has(index)) {
        removeFavorite(index);
        showToast({
          title: 'Success',
          description: 'Referendum removed from favorites',
          variant: 'default'
        });
      } else {
        addFavorite(index);
        showToast({
          title: 'Success',
          description: 'Referendum added to favorites',
          variant: 'default'
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive'
      });
    }
  };

  const renderReferendum = (referendum: Referendum) => (
    <Card key={referendum.index} className="p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{referendum.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Track: {referendum.track} • Status: {referendum.status}
          </p>
          <p className="text-sm text-gray-500">
            Submitted {formatDistanceToNow(new Date(referendum.submittedAt), { addSuffix: true })}
          </p>
          <p className="mt-2 text-gray-700 line-clamp-2">
            {referendum.description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleFavorite(referendum.index)}
          className="hover:bg-gray-100"
        >
          {favorites.has(referendum.index) ? '★' : '☆'}
        </Button>
      </div>
      <div className="mt-4 flex items-center space-x-4">
        <div className="flex-1">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (Number(referendum.tally.ayes) /
                    (Number(referendum.tally.ayes) +
                      Number(referendum.tally.nays))) *
                  100
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-500">
            <span>Ayes: {referendum.tally.ayes}</span>
            <span>Nays: {referendum.tally.nays}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  if (!session?.user?.address) {
    return (
      <Card className="p-4 text-center">
        <p>Please connect your wallet to track referenda.</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-center text-red-600">
        <p>{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadFavoriteReferenda}
          className="mt-4"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Favorite Referenda</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadFavoriteReferenda}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading favorite referenda...</p>
        </div>
      ) : referenda.length > 0 ? (
        <div className="space-y-4">
          {referenda.map(renderReferendum)}
        </div>
      ) : (
        <Card className="p-4 text-center">
          <p>No favorite referenda yet. Star a referendum to track it here.</p>
        </Card>
      )}
    </div>
  );
} 