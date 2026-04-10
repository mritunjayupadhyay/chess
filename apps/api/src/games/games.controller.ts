import { Controller, Get, Post, Param, Query, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';

@ApiTags('Games')
@Controller('api/games')
export class GamesController {
    constructor(
        private readonly gamesService: GamesService,
    ) {}

    @Post()
    async create(
        @Body() body: { timeControl: 'blitz' | 'rapid'; chessProfileId: string },
    ) {
        if (!body.timeControl || !body.chessProfileId) {
            throw new BadRequestException('timeControl and chessProfileId are required');
        }
        return this.gamesService.createWaiting({
            createdByProfileId: body.chessProfileId,
            timeControl: body.timeControl,
        });
    }

    @Post(':id/join')
    async join(
        @Param('id') id: string,
        @Body() body: { chessProfileId: string },
    ) {
        if (!body.chessProfileId) {
            throw new BadRequestException('chessProfileId is required');
        }
        const game = await this.gamesService.join(id, body.chessProfileId);
        if (!game) {
            throw new NotFoundException('Game not found, not joinable, or you are already in it');
        }
        return game;
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        const game = await this.gamesService.findById(id);
        if (!game) throw new NotFoundException('Game not found');
        return game;
    }

    @Get()
    async list(
        @Query('profileId') profileId: string,
        @Query('status') status: string | undefined,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        if (status === 'waiting') {
            return this.gamesService.findWaiting(limit ? parseInt(limit, 10) : 50);
        }
        if (!profileId) return [];
        return this.gamesService.findByProfileId(
            profileId,
            limit ? parseInt(limit, 10) : 20,
            offset ? parseInt(offset, 10) : 0,
        );
    }
}
