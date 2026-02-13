import { Module } from "@nestjs/common";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";
import { GameModule } from "./game/game.module";
import { MembersModule } from "./members/members.module";
import { ChessProfilesModule } from "./chess-profiles/chess-profiles.module";
import { GamesModule } from "./games/games.module";
import { MovesModule } from "./moves/moves.module";

@Module({
  imports: [GameModule, MembersModule, ChessProfilesModule, GamesModule, MovesModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class AppModule {}
