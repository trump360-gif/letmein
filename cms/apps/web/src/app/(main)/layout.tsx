import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { DemoSidebar } from '@/components/demo/demo-sidebar'
import { SidebarProvider } from '@/components/demo/sidebar-context'
import { MainWrapper } from '@/components/demo/main-wrapper'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainWrapper>
        <SiteHeader />
        <main className="min-h-[calc(100vh-108px)]">{children}</main>
        <SiteFooter />
      </MainWrapper>
      <DemoSidebar />
    </SidebarProvider>
  )
}
