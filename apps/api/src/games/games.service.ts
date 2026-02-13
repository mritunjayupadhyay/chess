import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, or, desc } from 'drizzle-orm';
import * as schema from 'exam-question-bank-db';

@Injectable()
export class GamesService {
    constructor(
        @Inject('DATABASE') private db: PostgresJsDatabase<typeof schema>,
    ) {}

    async create(data: {
        whitePlayerId: string;
        blackPlayerId: string;
        timeControl: 'blitz' | 'rapid';
    }) {
        const rows = await this.db
            .insert(schema.games)
            .values({
                whitePlayerId: data.whitePlayerId,
                blackPlayerId: data.blackPlayerId,
                timeControl: data.timeControl,
            })
            .returning();
        return rows[0];
    }

    async endGame(
        gameId: string,
        data: {
            result: 'white_win' | 'black_win' | 'draw' | 'abandoned';
            endReason: 'checkmate' | 'resign' | 'timeout' | 'stalemate' | 'disconnect' | 'agreement' | 'insufficient_material' | 'fifty_move_rule' | 'threefold_repetition';
            winnerId: string | null;
            finalFen: string;
            durationSeconds: number;
            totalMoves: number;
        },
    ) {
        const rows = await this.db
            .update(schema.games)
            .set({
                result: data.result,
                endReason: data.endReason,
                winnerId: data.winnerId,
                finalFen: data.finalFen,
                durationSeconds: data.durationSeconds,
                totalMoves: data.totalMoves,
                endedAt: new Date(),
            })
            .where(eq(schema.games.id, gameId))
            .returning();
        return rows[0];
    }

    async findById(id: string) {
        const rows = await this.db.query.games.findFirst({
            where: eq(schema.games.id, id),
            with: {
                whitePlayer: true,
                blackPlayer: true,
                winner: true,
                moves: true,
            },
        });
        return rows ?? null;
    }

    async findByProfileId(profileId: string, limit = 20, offset = 0) {
        return this.db.query.games.findMany({
            where: or(
                eq(schema.games.whitePlayerId, profileId),
                eq(schema.games.blackPlayerId, profileId),
            ),
            orderBy: [desc(schema.games.createdAt)],
            limit,
            offset,
            with: {
                whitePlayer: true,
                blackPlayer: true,
                winner: true,
            },
        });
    }
}
