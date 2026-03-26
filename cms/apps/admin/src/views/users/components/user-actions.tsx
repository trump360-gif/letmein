'use client'

import Link from 'next/link'
import { Star, Coins } from 'lucide-react'
import { Button } from '@letmein/ui'

export function UserActions() {
  return (
    <>
      <Link href="/members/users/grades">
        <Button variant="outline" size="sm">
          <Star className="mr-1 h-3.5 w-3.5" />
          등급 관리
        </Button>
      </Link>
      <Link href="/members/users/points">
        <Button variant="outline" size="sm">
          <Coins className="mr-1 h-3.5 w-3.5" />
          포인트 규칙
        </Button>
      </Link>
    </>
  )
}
