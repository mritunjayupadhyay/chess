import { useState, useCallback } from 'react';
import type { Game } from '../../lib/api-types';
import { getGamesByProfileId } from '../../lib/api';

const PAGE_SIZE = 20;

export function useGameHistory(profileId: string | undefined) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadMore = useCallback(async () => {
    if (!profileId || loading) return;
    setLoading(true);
    try {
      const batch = await getGamesByProfileId(profileId, PAGE_SIZE, offset);
      setGames((prev) => [...prev, ...batch]);
      setHasMore(batch.length === PAGE_SIZE);
      setOffset((prev) => prev + batch.length);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [profileId, offset, loading]);

  return { games, loading, hasMore, loadMore, initialLoaded };
}
