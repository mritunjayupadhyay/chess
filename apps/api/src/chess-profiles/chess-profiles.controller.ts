import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChessProfilesService } from './chess-profiles.service';

@ApiTags('Chess Profiles')
@Controller('api/chess-profiles')
export class ChessProfilesController {
    constructor(private readonly chessProfilesService: ChessProfilesService) {}

    @Get()
    async getAll(
        @Query('sortBy') sortBy?: 'wins' | 'gamesPlayed',
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.chessProfilesService.findAll(
            sortBy || 'wins',
            limit ? parseInt(limit, 10) : 50,
            offset ? parseInt(offset, 10) : 0,
        );
    }

    @Get('member/:memberId')
    async getByMemberId(@Param('memberId') memberId: string) {
        return this.chessProfilesService.findByMemberId(memberId);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.chessProfilesService.findById(id);
    }

    @Post()
    async create(@Body() body: { memberId: string; username: string }) {
        return this.chessProfilesService.findOrCreate(body.memberId, body.username);
    }

    @Put(':id')
    async updateUsername(
        @Param('id') id: string,
        @Body() body: { username: string },
    ) {
        return this.chessProfilesService.updateUsername(id, body.username);
    }
}
