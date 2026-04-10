import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, or, desc, and } from 'drizzle-orm';
import * as schema from 'exam-question-bank-db/schema/chess-db';

@Injectable()
export class GamesService {
    constructor(
        @Inject('DATABASE') private db: PostgresJsDatabase<typeof schema>,
    ) {}

    async markPlaying(gameId: string) {
        const rows = await this.db
            .update(schema.games)
            .set({ status: 'playing' })
            .where(and(eq(schema.games.id, gameId), eq(schema.games.status, 'ready')))
            .returning();
        return rows[0] ?? null;
    }

    async findWaiting(limit = 50) {
        return this.db.query.games.findMany({
            where: eq(schema.games.status, 'waiting'),
            orderBy: [desc(schema.games.createdAt)],
            limit,
        });
    }

    async createWaiting(data: { createdByProfileId: string; timeControl: 'blitz' | 'rapid' }) {
    const rows = await this.db.insert(schema.games).values({                                                                                                                                                         
      createdByProfileId: data.createdByProfileId,                                                                                                                                                                   
      timeControl: data.timeControl,                                                                                                                                                                                 
      status: 'waiting',                                                                                                                                                                                             
    }).returning();                                                                                                                                                                                                  
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

    async join(gameId: string, joinerProfileId: string) {                                                                                                                                                              
    // Load, validate, randomly assign colors, update in one transaction.
    return this.db.transaction(async (tx) => {                                                                                                                                                                       
      const game = await tx.query.games.findFirst({ where: eq(schema.games.id, gameId) });                                                                                                                           
      if (!game || game.status !== 'waiting') return null;                                                                                                                                                           
      if (game.createdByProfileId === joinerProfileId) return null;                                                                                                                                                  
                                                                                                                                                                                                                     
      const creatorIsWhite = Math.random() < 0.5;                                                                                                                                                                    
      const whitePlayerId = creatorIsWhite ? game.createdByProfileId : joinerProfileId;                                                                                                                              
      const blackPlayerId = creatorIsWhite ? joinerProfileId : game.createdByProfileId;                                                                                                                              
                                                                                                                                                                                                                     
      const [updated] = await tx.update(schema.games)                                                                                                                                                                
        .set({ whitePlayerId, blackPlayerId, status: 'ready' })
        .where(and(eq(schema.games.id, gameId), eq(schema.games.status, 'waiting')))                                                                                                                                 
        .returning();                                                                                                                                                                                                
      return updated ?? null;
    });                                                                                                                                                                                                              
  } 
}
