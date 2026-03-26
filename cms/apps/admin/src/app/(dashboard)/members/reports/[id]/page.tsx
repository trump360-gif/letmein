import { ReportDetailPage } from '@/views/reports/[id]'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReportDetailPage reportId={id} />
}
