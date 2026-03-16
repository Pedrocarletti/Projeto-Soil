import { DashboardScreen } from '@/components/dashboard/dashboard-screen';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; farmId?: string }>;
}) {
  const params = await searchParams;
  const tab =
    params.tab === 'fazendas' ||
    params.tab === 'mapa' ||
    params.tab === 'historico'
      ? params.tab
      : params.tab === 'pivots'
        ? 'pivots'
        : 'fazendas';

  return <DashboardScreen initialTab={tab} initialFarmId={params.farmId} />;
}
