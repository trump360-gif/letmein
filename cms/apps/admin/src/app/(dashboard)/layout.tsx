import { Sidebar } from '@/widgets/sidebar'
import { Header } from '@/widgets/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-x-auto p-6">{children}</main>
      </div>
    </div>
  )
}
