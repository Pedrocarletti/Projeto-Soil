import { DashboardScreen } from '@/components/dashboard/dashboard-screen';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab =
    params.tab === 'mapa' || params.tab === 'historico'
      ? params.tab
      : 'pivots';

  return <DashboardScreen initialTab={tab} />;
}
