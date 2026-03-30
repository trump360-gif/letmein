import { redirect } from 'next/navigation'
import { getSessionHospitalId } from '@/lib/session'
import { HospitalChatListView } from '@/views/hospital/chat/HospitalChatListView'

export default async function Page() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) redirect('/hospital-login')

  return <HospitalChatListView />
}
