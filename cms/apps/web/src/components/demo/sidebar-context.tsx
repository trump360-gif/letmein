'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarCtx {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarCtx>({ isOpen: true, setIsOpen: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
