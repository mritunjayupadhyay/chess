import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { Member, ChessProfile } from '../../lib/api-types';
import {
  getMemberByClerkId,
  createMember,
  getChessProfileByMemberId,
  createChessProfile,
} from '../../lib/api';

export function useChessProfile() {
  const { user } = useUser();
  const [member, setMember] = useState<Member | null>(null);
  const [profile, setProfile] = useState<ChessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        let m = await getMemberByClerkId(user!.id).catch(() => null);
        if (cancelled) return;

        if (!m?.id) {
          m = await createMember({
            clerkId: user!.id,
            email: user!.primaryEmailAddress?.emailAddress || '',
            firstName: user!.firstName || '',
            lastName: user!.lastName || '',
          });
        }
        if (cancelled || !m?.id) return;
        setMember(m);

        let p = await getChessProfileByMemberId(m.id).catch(() => null);
        if (cancelled) return;

        if (!p?.id) {
          const username =
            [user!.firstName, user!.lastName].filter(Boolean).join('_') ||
            user!.id;
          p = await createChessProfile(m.id, username);
        }
        if (cancelled) return;

        setProfile(p);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { member, profile, loading, error, setProfile };
}
