import { Controller, Get, Post, Param, Query, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { PendingGamesService } from './pending-games.service';

@ApiTags('Games')
@Controller('api/games')
export class GamesController {
    constructor(
        private readonly gamesService: GamesService,
        private readonly pendingGamesService: PendingGamesService,
    ) {}

    @Post()
    async create(
        @Body() body: { timeControl: 'blitz' | 'rapid'; chessProfileId: string },
    ) {
        if (!body.timeControl || !body.chessProfileId) {
            throw new BadRequestException('timeControl and chessProfileId are required');
        }
        const game = this.pendingGamesService.createGame(body.timeControl, body.chessProfileId);
        return { id: game.id, timeControl: game.timeControl, status: game.status };
    }

    @Post(':id/join')
    async join(
        @Param('id') id: string,
        @Body() body: { chessProfileId: string },
    ) {
        if (!body.chessProfileId) {
            throw new BadRequestException('chessProfileId is required');
        }
        const game = this.pendingGamesService.joinGame(id, body.chessProfileId);
        if (!game) {
            throw new NotFoundException('Game not found, already full, or you are already in it');
        }
        return {
            id: game.id,
            timeControl: game.timeControl,
            status: game.status,
            whiteProfileId: game.whiteProfileId,
            blackProfileId: game.blackProfileId,
        };
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        // Check DB first
        const dbGame = await this.gamesService.findById(id);
        if (dbGame) return dbGame;

        // Check pending games
        const pending = this.pendingGamesService.getGame(id);
        if (pending) {
            return {
                id: pending.id,
                timeControl: pending.timeControl,
                status: pending.status,
                players: pending.players.map(p => ({ chessProfileId: p.chessProfileId })),
                whiteProfileId: pending.whiteProfileId,
                blackProfileId: pending.blackProfileId,
                pending: true,
            };
        }

        throw new NotFoundException('Game not found');
    }

    @Get()
    async list(
        @Query('profileId') profileId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        if (!profileId) return [];
        return this.gamesService.findByProfileId(
            profileId,
            limit ? parseInt(limit, 10) : 20,
            offset ? parseInt(offset, 10) : 0,
        );
    }
}
