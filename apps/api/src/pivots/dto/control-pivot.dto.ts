import { PivotDirection } from '../../common/enums/pivot-direction.enum';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export enum PivotIrrigationMode {
  WATER = 'water',
  MOVEMENT = 'movement',
}

export class ControlPivotDto {
  @IsBoolean()
  isOn!: boolean;

  @IsEnum(PivotDirection)
  direction!: PivotDirection;

  @IsEnum(PivotIrrigationMode)
  irrigationMode!: PivotIrrigationMode;

  @IsOptional()
  @ValidateIf(
    (value: ControlPivotDto) =>
      value.isOn && value.irrigationMode === PivotIrrigationMode.WATER,
  )
  @IsInt()
  @Min(0)
  @Max(100)
  percentimeter?: number;
}
