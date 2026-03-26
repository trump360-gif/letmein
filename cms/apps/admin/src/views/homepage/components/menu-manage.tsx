'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import type { MenuItem, MenuLocation } from '@letmein/types'
import { MENU_LOCATION_VALUES, MENU_LOCATION_LABELS } from '@letmein/types'
import { useMenus } from '@/features/menu-manage'
import { MenuTree } from '@/views/menus/components/menu-tree'
import { MenuFormDialog } from '@/views/menus/components/menu-form-dialog'

export function MenuManage() {
  const [activeTab, setActiveTab] = useState<MenuLocation>('gnb')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)

  const { data, isLoading } = useMenus(activeTab)

  function handleEdit(menu: MenuItem) {
    setEditingMenu(menu)
    setAddParentId(null)
    setDialogOpen(true)
  }

  function handleAddChild(parentId: string) {
    setEditingMenu(null)
    setAddParentId(parentId)
    setDialogOpen(true)
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditingMenu(null)
      setAddParentId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MenuLocation)}
      >
        <TabsList>
          {MENU_LOCATION_VALUES.map((loc) => (
            <TabsTrigger key={loc} value={loc}>
              {MENU_LOCATION_LABELS[loc]}
            </TabsTrigger>
          ))}
        </TabsList>

        {MENU_LOCATION_VALUES.map((loc) => (
          <TabsContent key={loc} value={loc} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <MenuTree
                menus={data?.menus ?? []}
                location={loc}
                onEdit={handleEdit}
                onAddChild={handleAddChild}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        menu={editingMenu}
        parentId={addParentId}
        location={activeTab}
      />
    </div>
  )
}
