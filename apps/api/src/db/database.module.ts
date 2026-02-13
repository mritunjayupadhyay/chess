import { Module, Provider } from '@nestjs/common';
import { getDb } from './database.config';

const databaseProvider: Provider = {
  provide: 'DATABASE',
  useFactory: () => {
    return getDb();
  },
};

@Module({
  providers: [databaseProvider],
  exports: ['DATABASE'],
})
export class DatabaseModule {}
