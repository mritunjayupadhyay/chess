import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { ChessProfilesController } from './chess-profiles.controller';
import { ChessProfilesService } from './chess-profiles.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ChessProfilesController],
    providers: [ChessProfilesService],
    exports: [ChessProfilesService],
})
export class ChessProfilesModule {}
