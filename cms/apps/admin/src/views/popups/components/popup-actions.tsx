'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@letmein/ui'
import { PopupFormDialog } from './popup-form-dialog'

export function PopupActions() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        팝업 추가
      </Button>
      <PopupFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        popup={null}
      />
    </>
  )
}
