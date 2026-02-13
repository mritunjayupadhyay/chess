import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { MovesController } from './moves.controller';
import { MovesService } from './moves.service';

@Module({
    imports: [DatabaseModule],
    controllers: [MovesController],
    providers: [MovesService],
    exports: [MovesService],
})
export class MovesModule {}
