import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GamePresenceService } from './game-presence.service';

@Module({
    imports: [DatabaseModule],
    controllers: [GamesController],
    providers: [GamesService, GamePresenceService],
    exports: [GamesService, GamePresenceService],
})
export class GamesModule {}
