'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@letmein/ui'
import { SanctionDialog } from './sanction-dialog'

export function SanctionActions() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setDialogOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        제재 적용
      </Button>
      <SanctionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
