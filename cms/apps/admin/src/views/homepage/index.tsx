'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import { PanelTop, PanelBottom, Menu, LayoutGrid } from 'lucide-react'
import { HeaderManage } from './components/header-manage'
import { FooterManage } from './components/footer-manage'
import { MenuManage } from './components/menu-manage'
import { SectionManage } from './components/section-manage'

export function HomepagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">홈페이지 관리</h2>
        <p className="text-muted-foreground">
          사이트의 헤더, 푸터, 메뉴, 인덱스 페이지 섹션을 관리합니다.
        </p>
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">
            <LayoutGrid className="mr-2 h-4 w-4" />
            섹션 관리
          </TabsTrigger>
          <TabsTrigger value="header">
            <PanelTop className="mr-2 h-4 w-4" />
            헤더
          </TabsTrigger>
          <TabsTrigger value="footer">
            <PanelBottom className="mr-2 h-4 w-4" />
            푸터
          </TabsTrigger>
          <TabsTrigger value="menu">
            <Menu className="mr-2 h-4 w-4" />
            메뉴관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <SectionManage />
        </TabsContent>
        <TabsContent value="header">
          <HeaderManage />
        </TabsContent>
        <TabsContent value="footer">
          <FooterManage />
        </TabsContent>
        <TabsContent value="menu">
          <MenuManage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
