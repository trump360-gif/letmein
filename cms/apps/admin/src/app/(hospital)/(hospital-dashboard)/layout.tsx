import { HospitalSidebar } from '@/widgets/sidebar/HospitalSidebar'
import { Header } from '@/widgets/header'

export default function HospitalDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <HospitalSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-x-auto p-6">{children}</main>
      </div>
    </div>
  )
}
