import { Injectable, Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from 'exam-question-bank-db';

@Injectable()
export class MembersService {
  constructor(
    @Inject('DATABASE') private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(schema.members);
  }
}
