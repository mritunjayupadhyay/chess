export interface Member {
  id: string;
  clerkId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: 'male' | 'female' | 'other' | null;
  profilePic: string | null;
  birthday: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChessProfile {
  id: string;
  userId: string;
  username: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  updatedAt: string;
}

export interface Move {
  id: string;
  gameId: string;
  ply: number;
  playerId: string;
  notation: string;
  fenAfter: string;
  createdAt: string;
}

export interface Game {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  result: 'white_win' | 'black_win' | 'draw' | 'abandoned' | null;
  endReason: string | null;
  winnerId: string | null;
  timeControl: 'blitz' | 'rapid' | null;
  startingFen: string;
  finalFen: string | null;
  totalMoves: number;
  durationSeconds: number | null;
  rematchOf: string | null;
  createdAt: string;
  endedAt: string | null;
  whitePlayer?: ChessProfile;
  blackPlayer?: ChessProfile;
  winner?: ChessProfile | null;
}

export interface GameDetail extends Game {
  moves?: Move[];
}

export interface PendingGame {
  id: string;
  timeControl: 'blitz' | 'rapid';
  status: 'waiting' | 'ready' | 'started';
  players?: { chessProfileId: string }[];
  whiteProfileId?: string;
  blackProfileId?: string;
  pending: true;
}
