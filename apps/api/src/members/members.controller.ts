import { Controller, Get } from '@nestjs/common';
import { MembersService } from './members.service';

@Controller('api/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async getMembers() {
    return this.membersService.findAll();
  }
}
