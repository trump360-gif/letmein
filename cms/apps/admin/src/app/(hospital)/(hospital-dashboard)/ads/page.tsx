import { redirect } from 'next/navigation'
import { getSessionHospitalId } from '@/lib/session'
import { HospitalAdsView } from '@/views/hospital/ads/HospitalAdsView'

export default async function AdsPage() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) redirect('/hospital-login')

  return <HospitalAdsView />
}
