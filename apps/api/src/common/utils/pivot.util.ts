import { Direction } from '@prisma/client';
import { PivotDirection } from '../enums/pivot-direction.enum';

export function toPrismaDirection(direction: PivotDirection): Direction {
  switch (direction) {
    case PivotDirection.CLOCKWISE:
      return Direction.CLOCKWISE;
    case PivotDirection.COUNTER_CLOCKWISE:
      return Direction.COUNTER_CLOCKWISE;
    default:
      return Direction.STOPPED;
  }
}

export function toClientDirection(
  direction: Direction | null | undefined,
): PivotDirection {
  switch (direction) {
    case Direction.CLOCKWISE:
      return PivotDirection.CLOCKWISE;
    case Direction.COUNTER_CLOCKWISE:
      return PivotDirection.COUNTER_CLOCKWISE;
    default:
      return PivotDirection.STOPPED;
  }
}

export function calculateAppliedBlade(
  bladeAt100: number,
  percentimeter: number,
) {
  return Number(((bladeAt100 * percentimeter) / 100).toFixed(2));
}
