import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, asc } from 'drizzle-orm';
import * as schema from 'exam-question-bank-db';

@Injectable()
export class MovesService {
    constructor(
        @Inject('DATABASE') private db: PostgresJsDatabase<typeof schema>,
    ) {}

    async create(data: {
        gameId: string;
        ply: number;
        playerId: string;
        notation: string;
        fenAfter: string;
    }) {
        const rows = await this.db
            .insert(schema.moves)
            .values({
                gameId: data.gameId,
                ply: data.ply,
                playerId: data.playerId,
                notation: data.notation,
                fenAfter: data.fenAfter,
            })
            .returning();
        return rows[0];
    }

    async findByGameId(gameId: string) {
        return this.db
            .select()
            .from(schema.moves)
            .where(eq(schema.moves.gameId, gameId))
            .orderBy(asc(schema.moves.ply));
    }
}
