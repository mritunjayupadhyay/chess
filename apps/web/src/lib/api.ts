import type { Member, ChessProfile, Game, GameDetail, Move, PendingGame } from './api-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  error: boolean;
  msg: string;
  data: T;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const body: ApiResponse<T> = await res.json();
  if (body.error) {
    throw new Error(body.msg || `API error ${res.status}`);
  }
  return body.data;
}

// Members
export function getMemberByClerkId(clerkId: string) {
  return apiFetch<Member>(`/api/members/clerk/${clerkId}`);
}

export function createMember(data: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  return apiFetch<Member>('/api/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMember(
  id: string,
  data: { firstName?: string; lastName?: string; phone?: string },
) {
  return apiFetch<Member>(`/api/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Chess Profiles
export function getChessProfileByMemberId(memberId: string) {
  return apiFetch<ChessProfile>(`/api/chess-profiles/member/${memberId}`);
}

export function getChessProfileById(id: string) {
  return apiFetch<ChessProfile>(`/api/chess-profiles/${id}`);
}

export function createChessProfile(memberId: string, username: string) {
  return apiFetch<ChessProfile>('/api/chess-profiles', {
    method: 'POST',
    body: JSON.stringify({ memberId, username }),
  });
}

export function updateChessProfile(id: string, username: string) {
  return apiFetch<ChessProfile>(`/api/chess-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
}

export function getLeaderboard(
  sortBy: 'wins' | 'gamesPlayed' = 'wins',
  limit = 50,
  offset = 0,
) {
  return apiFetch<ChessProfile[]>(
    `/api/chess-profiles?sortBy=${sortBy}&limit=${limit}&offset=${offset}`,
  );
}

// Games
export function getGamesByProfileId(profileId: string, limit = 20, offset = 0) {
  return apiFetch<Game[]>(
    `/api/games?profileId=${profileId}&limit=${limit}&offset=${offset}`,
  );
}

export function getGameById(id: string) {
  return apiFetch<GameDetail>(`/api/games/${id}`);
}

// Game creation (REST-based flow)
export function createGame(data: { timeControl: 'blitz' | 'rapid'; chessProfileId: string }) {
  return apiFetch<{ id: string; timeControl: string; status: string }>('/api/games', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function joinGame(gameId: string, chessProfileId: string) {
  return apiFetch<{
    id: string;
    timeControl: string;
    status: string;
    whiteProfileId: string;
    blackProfileId: string;
  }>(`/api/games/${gameId}/join`, {
    method: 'POST',
    body: JSON.stringify({ chessProfileId }),
  });
}

// Moves
export function getMovesByGameId(gameId: string) {
  return apiFetch<Move[]>(`/api/moves?gameId=${gameId}`);
}
