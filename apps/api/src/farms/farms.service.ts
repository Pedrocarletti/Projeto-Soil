import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.farm.findMany({
      include: {
        pivots: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: {
        pivots: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found.');
    }

    return farm;
  }

  async create(createFarmDto: CreateFarmDto) {
    return this.prisma.farm.create({
      data: createFarmDto,
      include: {
        pivots: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async update(id: string, updateFarmDto: UpdateFarmDto) {
    await this.findOne(id);

    return this.prisma.farm.update({
      where: { id },
      data: updateFarmDto,
      include: {
        pivots: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pivots: true,
          },
        },
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found.');
    }

    if (farm._count.pivots > 0) {
      throw new BadRequestException(
        'Remova ou transfira os pivots vinculados antes de excluir a fazenda.',
      );
    }

    await this.prisma.farm.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
