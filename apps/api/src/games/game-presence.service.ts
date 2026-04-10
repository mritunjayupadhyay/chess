import { Injectable } from '@nestjs/common';

@Injectable()
export class GamePresenceService {
    // gameId -> Map<chessProfileId, socketId>
    private presence = new Map<string, Map<string, string>>();

    setPlayerSocket(gameId: string, chessProfileId: string, socketId: string): void {
        let inner = this.presence.get(gameId);
        if (!inner) {
            inner = new Map();
            this.presence.set(gameId, inner);
        }
        inner.set(chessProfileId, socketId);
    }

    getSocketId(gameId: string, chessProfileId: string): string | undefined {
        return this.presence.get(gameId)?.get(chessProfileId);
    }

    areBothConnected(gameId: string): boolean {
        const inner = this.presence.get(gameId);
        return !!inner && inner.size >= 2;
    }

    clear(gameId: string): void {
        this.presence.delete(gameId);
    }

    clearPlayer(gameId: string, chessProfileId: string): void {
        this.presence.get(gameId)?.delete(chessProfileId);
    }
}
