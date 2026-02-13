import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';

@ApiTags('Games')
@Controller('api/games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) {}

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.gamesService.findById(id);
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
