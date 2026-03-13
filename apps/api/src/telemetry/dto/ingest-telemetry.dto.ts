import { PivotDirection } from '../../common/enums/pivot-direction.enum';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class IngestTelemetryDto {
  @IsOptional()
  @IsUUID()
  pivotId?: string;

  @IsOptional()
  @IsString()
  pivotCode?: string;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsBoolean()
  isOn!: boolean;

  @IsEnum(PivotDirection)
  direction!: PivotDirection;

  @IsBoolean()
  isIrrigating!: boolean;

  @IsOptional()
  @IsNumber()
  angle?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentimeter?: number;

  @IsOptional()
  @IsString()
  source?: string;
}
