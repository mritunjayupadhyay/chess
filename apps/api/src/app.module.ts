import { Module } from "@nestjs/common";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";
import { GameModule } from "./game/game.module";
import { MembersModule } from "./members/members.module";

@Module({
  imports: [GameModule, MembersModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class AppModule {}
