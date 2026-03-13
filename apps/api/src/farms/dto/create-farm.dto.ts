import { IsNumber, IsString } from 'class-validator';

export class CreateFarmDto {
  @IsString()
  name!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;
}
