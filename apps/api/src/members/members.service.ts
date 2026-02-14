import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from 'exam-question-bank-db';

@Injectable()
export class MembersService {
  constructor(
    @Inject('DATABASE') private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(schema.members);
  }

  async findByClerkId(clerkId: string) {
    const rows = await this.db
      .select()
      .from(schema.members)
      .where(eq(schema.members.clerkId, clerkId));
    return rows[0] ?? null;
  }

  async update(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const rows = await this.db
      .update(schema.members)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.members.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
