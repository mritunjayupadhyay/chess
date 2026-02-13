import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChessProfilesService } from './chess-profiles.service';

@ApiTags('Chess Profiles')
@Controller('api/chess-profiles')
export class ChessProfilesController {
    constructor(private readonly chessProfilesService: ChessProfilesService) {}

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.chessProfilesService.findById(id);
    }

    @Get('member/:memberId')
    async getByMemberId(@Param('memberId') memberId: string) {
        return this.chessProfilesService.findByMemberId(memberId);
    }

    @Post()
    async create(@Body() body: { memberId: string; username: string }) {
        return this.chessProfilesService.findOrCreate(body.memberId, body.username);
    }
}
