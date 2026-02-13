import { Controller, Get, Query } from '@nestjs/common';
import { MovesService } from './moves.service';

@Controller('api/moves')
export class MovesController {
    constructor(private readonly movesService: MovesService) {}

    @Get()
    async list(@Query('gameId') gameId: string) {
        if (!gameId) return [];
        return this.movesService.findByGameId(gameId);
    }
}
