import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PendingGamesService } from './pending-games.service';

@Module({
    imports: [DatabaseModule],
    controllers: [GamesController],
    providers: [GamesService, PendingGamesService],
    exports: [GamesService, PendingGamesService],
})
export class GamesModule {}
