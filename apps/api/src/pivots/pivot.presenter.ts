import type { Cycle, Farm, Pivot, Prisma, State } from '@prisma/client';
import { PivotDirection } from '../common/enums/pivot-direction.enum';
import { toClientDirection } from '../common/utils/pivot.util';

type PivotWithRelations = Pivot & {
  farm: Farm;
  states: Array<State & { cycles: Cycle[] }>;
};

function getNumericStatusValue(
  status: Prisma.JsonValue | null | undefined,
  key: string,
) {
  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return 0;
  }

  const value = (status as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}

export const pivotSummaryInclude = {
  farm: true,
  states: {
    orderBy: { timestamp: 'desc' as const },
    take: 1,
    include: {
      cycles: {
        orderBy: { timestamp: 'desc' as const },
        take: 1,
      },
    },
  },
};

export const pivotDetailInclude = {
  farm: true,
  states: {
    orderBy: { timestamp: 'desc' as const },
    take: 12,
    include: {
      cycles: {
        orderBy: { timestamp: 'desc' as const },
        take: 120,
      },
    },
  },
};

export function presentPivot(pivot: PivotWithRelations) {
  const latestState = pivot.states[0];
  const latestCycle = latestState?.cycles[0];

  return {
    ...pivot,
    live: {
      isOn: Boolean(latestState?.isOn && latestState.endedAt === null),
      direction: latestState
        ? toClientDirection(latestState.direction)
        : PivotDirection.STOPPED,
      isIrrigating: latestState?.isIrrigating ?? false,
      angle: latestCycle?.angle ?? getNumericStatusValue(pivot.status, 'angle'),
      percentimeter:
        latestCycle?.percentimeter ??
        getNumericStatusValue(pivot.status, 'percentimeter'),
      appliedBlade: latestCycle?.appliedBlade ?? 0,
    },
  };
}
