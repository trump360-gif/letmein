'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@letmein/ui'
import { MenuFormDialog } from './menu-form-dialog'

export function MenuActions() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        메뉴 추가
      </Button>
      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        menu={null}
        parentId={null}
        location="gnb"
      />
    </>
  )
}
