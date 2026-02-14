import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller('api/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async getMembers() {
    return this.membersService.findAll();
  }

  @Get('clerk/:clerkId')
  async getByClerkId(@Param('clerkId') clerkId: string) {
    return this.membersService.findByClerkId(clerkId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; phone?: string },
  ) {
    return this.membersService.update(id, body);
  }
}
