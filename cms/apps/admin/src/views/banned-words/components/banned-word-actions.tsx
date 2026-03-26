'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@letmein/ui'
import { WordForm } from './word-form'

export function BannedWordActions() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setFormOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        금칙어 추가
      </Button>
      <WordForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  )
}
