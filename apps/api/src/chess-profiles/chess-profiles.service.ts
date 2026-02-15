import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, sql, desc } from 'drizzle-orm';
import * as schema from 'exam-question-bank-db';

@Injectable()
export class ChessProfilesService {
    constructor(
        @Inject('DATABASE') private db: PostgresJsDatabase<typeof schema>,
    ) {}

    async findById(id: string) {
        const rows = await this.db
            .select()
            .from(schema.chessProfiles)
            .where(eq(schema.chessProfiles.id, id));
        return rows[0] ?? null;
    }

    async findByMemberId(memberId: string) {
        const rows = await this.db
            .select()
            .from(schema.chessProfiles)
            .where(eq(schema.chessProfiles.userId, memberId));
        return rows[0] ?? null;
    }

    async findOrCreate(memberId: string, username: string) {
        const existing = await this.findByMemberId(memberId);
        if (existing) return existing;
        return this.create(memberId, username);
    }

    async create(memberId: string, username: string) {
        try {
            const rows = await this.db
                .insert(schema.chessProfiles)
                .values({ userId: memberId, username })
                .returning();
            return rows[0];
        } catch (err: any) {
            if (err?.code === '23505' && err?.constraint?.includes('username')) {
                const suffix = Math.random().toString(36).substring(2, 6);
                const fallback = `${username}_${suffix}`;
                const rows = await this.db
                    .insert(schema.chessProfiles)
                    .values({ userId: memberId, username: fallback })
                    .returning();
                return rows[0];
            }
            throw err;
        }
    }

    async findAll(sortBy: 'wins' | 'gamesPlayed' = 'wins', limit = 50, offset = 0) {
        const orderCol =
            sortBy === 'wins'
                ? schema.chessProfiles.wins
                : schema.chessProfiles.gamesPlayed;
        return this.db
            .select()
            .from(schema.chessProfiles)
            .orderBy(desc(orderCol))
            .limit(limit)
            .offset(offset);
    }

    async updateUsername(id: string, username: string) {
        const rows = await this.db
            .update(schema.chessProfiles)
            .set({ username, updatedAt: new Date() })
            .where(eq(schema.chessProfiles.id, id))
            .returning();
        return rows[0] ?? null;
    }

    async incrementStats(
        profileId: string,
        outcome: 'win' | 'loss' | 'draw',
    ) {
        const winInc = outcome === 'win' ? 1 : 0;
        const lossInc = outcome === 'loss' ? 1 : 0;
        const drawInc = outcome === 'draw' ? 1 : 0;

        await this.db
            .update(schema.chessProfiles)
            .set({
                gamesPlayed: sql`${schema.chessProfiles.gamesPlayed} + 1`,
                wins: sql`${schema.chessProfiles.wins} + ${winInc}`,
                losses: sql`${schema.chessProfiles.losses} + ${lossInc}`,
                draws: sql`${schema.chessProfiles.draws} + ${drawInc}`,
                updatedAt: new Date(),
            })
            .where(eq(schema.chessProfiles.id, profileId));
    }
}
