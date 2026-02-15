import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';

@ApiTags('Members')
@Controller('api/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  async create(
    @Body() body: { clerkId: string; email: string; firstName: string; lastName: string },
  ) {
    return this.membersService.findOrCreateByClerkId(body.clerkId, {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  }

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
