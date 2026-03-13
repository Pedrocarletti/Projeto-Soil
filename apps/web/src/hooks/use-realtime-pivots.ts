'use client';

import { useEffect, useEffectEvent } from 'react';
import { io } from 'socket.io-client';
import { getWsUrl } from '@/lib/api';
import type { Pivot } from '@/types/domain';

interface UseRealtimePivotsOptions {
  enabled: boolean;
  pivotId?: string;
  token?: string | null;
  onSnapshot?: (pivot: Pivot) => void;
  onDetail?: (pivot: Pivot) => void;
}

export function useRealtimePivots({
  enabled,
  pivotId,
  token,
  onSnapshot,
  onDetail,
}: UseRealtimePivotsOptions) {
  const handleSnapshot = useEffectEvent((pivot: Pivot) => {
    onSnapshot?.(pivot);
  });

  const handleDetail = useEffectEvent((pivot: Pivot) => {
    onDetail?.(pivot);
  });

  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    const socket = io(getWsUrl(), {
      transports: ['websocket'],
      auth: { token },
      query: pivotId ? { pivotId } : undefined,
    });

    if (pivotId) {
      socket.emit('pivot.join', { pivotId });
    }

    socket.on('pivot.snapshot', handleSnapshot);
    socket.on('pivot.detail', handleDetail);

    return () => {
      socket.disconnect();
    };
  }, [enabled, pivotId, token]);
}
