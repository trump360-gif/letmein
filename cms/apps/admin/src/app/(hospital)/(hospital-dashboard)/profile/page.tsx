import type { Metadata } from 'next'
import HospitalProfileView from '@/views/hospital/profile/HospitalProfileView'

export const metadata: Metadata = {
  title: '병원 프로필 편집',
}

export default function HospitalProfilePage() {
  return <HospitalProfileView />
}
