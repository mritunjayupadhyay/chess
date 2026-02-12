import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomService } from './room.service';
import { GameStateService } from './game-state.service';

@Module({
    providers: [GameGateway, RoomService, GameStateService],
})
export class GameModule {}
