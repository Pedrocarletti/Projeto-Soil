import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ControlPivotDto } from './dto/control-pivot.dto';
import { CreatePivotDto } from './dto/create-pivot.dto';
import { PivotsService } from './pivots.service';

@Controller('pivots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PivotsController {
  constructor(private readonly pivotsService: PivotsService) {}

  @Get()
  findAll() {
    return this.pivotsService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pivotsService.findOne(id);
  }

  @Get(':id/history')
  history(@Param('id') id: string) {
    return this.pivotsService.history(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() createPivotDto: CreatePivotDto) {
    return this.pivotsService.create(createPivotDto);
  }

  @Post(':id/control')
  @Roles(Role.ADMIN, Role.OPERATOR)
  control(@Param('id') id: string, @Body() controlPivotDto: ControlPivotDto) {
    return this.pivotsService.control(id, controlPivotDto);
  }
}
