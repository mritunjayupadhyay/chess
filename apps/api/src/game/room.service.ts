import { Injectable } from '@nestjs/common';
import { IGameRoom, IPlayer, IRoomSummary, RoomStatus } from '@myproject/shared';
import { colorType, allColorType } from '@myproject/chess-logic';

@Injectable()
export class RoomService {
    private rooms = new Map<string, IGameRoom>();
    private playerRoomMap = new Map<string, string>(); // socketId -> roomId

    createRoom(roomName: string, player: IPlayer): IGameRoom {
        const roomId = this.generateRoomId();
        const room: IGameRoom = {
            roomId,
            roomName,
            players: [player],
            status: 'waiting',
            createdBy: player.id,
            createdAt: Date.now(),
        };
        this.rooms.set(roomId, room);
        this.playerRoomMap.set(player.id, roomId);
        return room;
    }

    joinRoom(roomId: string, player: IPlayer): IGameRoom | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        if (room.status !== 'waiting') return null;
        if (room.players.length >= 2) return null;
        if (room.players.find(p => p.id === player.id)) return null;

        room.players.push(player);
        this.playerRoomMap.set(player.id, roomId);
        return room;
    }

    leaveRoom(socketId: string): { room: IGameRoom; player: IPlayer } | null {
        const roomId = this.playerRoomMap.get(socketId);
        if (!roomId) return null;

        const room = this.rooms.get(roomId);
        if (!room) return null;

        const player = room.players.find(p => p.id === socketId);
        if (!player) return null;

        room.players = room.players.filter(p => p.id !== socketId);
        this.playerRoomMap.delete(socketId);

        if (room.players.length === 0) {
            this.rooms.delete(roomId);
        }

        return { room, player };
    }

    listRooms(): IRoomSummary[] {
        const summaries: IRoomSummary[] = [];
        this.rooms.forEach(room => {
            summaries.push({
                roomId: room.roomId,
                roomName: room.roomName,
                playerCount: room.players.length,
                status: room.status,
            });
        });
        return summaries;
    }

    getRoom(roomId: string): IGameRoom | undefined {
        return this.rooms.get(roomId);
    }

    getRoomBySocketId(socketId: string): IGameRoom | undefined {
        const roomId = this.playerRoomMap.get(socketId);
        if (!roomId) return undefined;
        return this.rooms.get(roomId);
    }

    assignColors(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (!room || room.players.length !== 2) return;

        const randomIndex = Math.random() < 0.5 ? 0 : 1;
        room.players[randomIndex].color = allColorType.LIGHT_COLOR;
        room.players[1 - randomIndex].color = allColorType.DARK_COLOR;
    }

    setRoomStatus(roomId: string, status: RoomStatus): void {
        const room = this.rooms.get(roomId);
        if (room) {
            room.status = status;
        }
    }

    getPlayerColor(roomId: string, socketId: string): colorType | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;
        const player = room.players.find(p => p.id === socketId);
        return player?.color;
    }

    createOrJoinGameRoom(gameId: string, player: IPlayer): IGameRoom {
        const roomId = `game:${gameId}`;
        const existing = this.rooms.get(roomId);

        if (existing) {
            if (!existing.players.find(p => p.id === player.id)) {
                existing.players.push(player);
            }
            this.playerRoomMap.set(player.id, roomId);
            return existing;
        }

        const room: IGameRoom = {
            roomId,
            roomName: `Game ${gameId.substring(0, 8)}`,
            players: [player],
            status: 'waiting',
            createdBy: player.id,
            createdAt: Date.now(),
        };
        this.rooms.set(roomId, room);
        this.playerRoomMap.set(player.id, roomId);
        return room;
    }

    findPlayerByChessProfileId(chessProfileId: string): { room: IGameRoom; player: IPlayer } | null {
        for (const room of this.rooms.values()) {
            const player = room.players.find(p => p.chessProfileId === chessProfileId);
            if (player) {
                return { room, player };
            }
        }
        return null;
    }

    updatePlayerSocket(chessProfileId: string, oldSocketId: string, newSocketId: string): void {
        const roomId = this.playerRoomMap.get(oldSocketId);
        if (roomId) {
            this.playerRoomMap.delete(oldSocketId);
            this.playerRoomMap.set(newSocketId, roomId);
        }

        for (const room of this.rooms.values()) {
            const player = room.players.find(p => p.chessProfileId === chessProfileId);
            if (player) {
                player.id = newSocketId;
                // Also update playerRoomMap if we didn't find it via oldSocketId
                if (!roomId) {
                    this.playerRoomMap.set(newSocketId, room.roomId);
                }
                break;
            }
        }
    }

    markPlayerDisconnected(socketId: string): { room: IGameRoom; player: IPlayer } | null {
        const roomId = this.playerRoomMap.get(socketId);
        if (!roomId) return null;

        const room = this.rooms.get(roomId);
        if (!room) return null;

        const player = room.players.find(p => p.id === socketId);
        if (!player) return null;

        // Remove from playerRoomMap but keep player in room.players
        this.playerRoomMap.delete(socketId);

        return { room, player };
    }

    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 10);
    }
}
