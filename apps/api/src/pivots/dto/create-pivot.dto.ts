import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreatePivotDto {
  @IsUUID()
  farmId!: string;

  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsNumber()
  bladeAt100!: number;
}
