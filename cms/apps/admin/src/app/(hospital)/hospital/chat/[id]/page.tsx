import { redirect } from 'next/navigation'
import { getSessionHospitalId } from '@/lib/session'
import { HospitalChatRoomView } from '@/views/hospital/chat/HospitalChatRoomView'

interface PageProps {
  params: { id: string }
}

export default async function Page({ params }: PageProps) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) redirect('/hospital-login')

  return <HospitalChatRoomView roomId={params.id} />
}
