import { BannerEditPage } from '@/views/banners/[id]'

export default function Page({ params }: { params: { id: string } }) {
  return <BannerEditPage bannerId={params.id} />
}
