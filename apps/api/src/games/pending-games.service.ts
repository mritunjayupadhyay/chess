import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type PendingGameStatus = 'waiting' | 'ready' | 'started';

export interface PendingGamePlayer {
    chessProfileId: string;
    socketId?: string;
}

export interface PendingGame {
    id: string;
    timeControl: 'blitz' | 'rapid';
    players: PendingGamePlayer[];
    whiteProfileId?: string;
    blackProfileId?: string;
    status: PendingGameStatus;
    createdAt: number;
}

@Injectable()
export class PendingGamesService {
    private games = new Map<string, PendingGame>();

    createGame(timeControl: 'blitz' | 'rapid', chessProfileId: string): PendingGame {
        const id = randomUUID();
        const game: PendingGame = {
            id,
            timeControl,
            players: [{ chessProfileId }],
            status: 'waiting',
            createdAt: Date.now(),
        };
        this.games.set(id, game);
        return game;
    }

    joinGame(gameId: string, chessProfileId: string): PendingGame | null {
        const game = this.games.get(gameId);
        if (!game) return null;
        if (game.status !== 'waiting') return null;
        if (game.players.length >= 2) return null;
        if (game.players.some(p => p.chessProfileId === chessProfileId)) return null;

        game.players.push({ chessProfileId });

        // Randomly assign white/black
        const randomIndex = Math.random() < 0.5 ? 0 : 1;
        game.whiteProfileId = game.players[randomIndex].chessProfileId;
        game.blackProfileId = game.players[1 - randomIndex].chessProfileId;
        game.status = 'ready';

        return game;
    }

    getGame(gameId: string): PendingGame | undefined {
        return this.games.get(gameId);
    }

    setPlayerSocket(gameId: string, chessProfileId: string, socketId: string): void {
        const game = this.games.get(gameId);
        if (!game) return;
        const player = game.players.find(p => p.chessProfileId === chessProfileId);
        if (player) {
            player.socketId = socketId;
        }
    }

    areBothPlayersConnected(gameId: string): boolean {
        const game = this.games.get(gameId);
        if (!game || game.players.length !== 2) return false;
        return game.players.every(p => !!p.socketId);
    }

    removeGame(gameId: string): void {
        this.games.delete(gameId);
    }
}
