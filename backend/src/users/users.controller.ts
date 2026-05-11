import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import type { Request } from 'express';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { User as UserEntity } from 'src/_gen/prisma-class/user';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // - `GET /api/users/profile`: 현재 사용자 프로필 조회
  // - `PATCH /api/users/profile`: 사용자 프로필 업데이트
  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: '현재 사용자 프로필 조회 성공',
    type: UserEntity,
  })
  getProfile(@Req() req: Request) {
    return this.usersService.getProfile(req.user!.sub);
  }

  @Patch('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: '현재 사용자 프로필 업데이트 성공',
    type: UserEntity,
  })
  updateUser(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user!.sub, updateUserDto);
  }
}
