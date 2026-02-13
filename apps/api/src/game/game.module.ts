import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { GameStateService } from './game-state.service';
import { ChessProfilesModule } from '../chess-profiles/chess-profiles.module';
import { GamesModule } from '../games/games.module';
import { MovesModule } from '../moves/moves.module';

@Module({
    imports: [ChessProfilesModule, GamesModule, MovesModule],
    providers: [GameGateway, RoomService, GameStateService],
})
export class GameModule {}
