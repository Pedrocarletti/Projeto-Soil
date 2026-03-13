import { PivotDetailScreen } from '@/components/pivots/pivot-detail-screen';

export default async function PivotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PivotDetailScreen pivotId={id} />;
}
