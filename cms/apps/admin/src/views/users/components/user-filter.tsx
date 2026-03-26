'use client'

import { Search, X } from 'lucide-react'
import { Button, Input } from '@letmein/ui'
import { USER_STATUS, USER_GRADES } from '@/shared/lib/constants'
import type { UserStatus } from '@letmein/types'

interface UserFilterProps {
  search: string
  onSearchChange: (value: string) => void
  grade: number | undefined
  onGradeChange: (value: number | undefined) => void
  status: UserStatus | undefined
  onStatusChange: (value: UserStatus | undefined) => void
  joinFrom: string
  onJoinFromChange: (value: string) => void
  joinTo: string
  onJoinToChange: (value: string) => void
  onReset: () => void
}

export function UserFilter({
  search,
  onSearchChange,
  grade,
  onGradeChange,
  status,
  onStatusChange,
  joinFrom,
  onJoinFromChange,
  joinTo,
  onJoinToChange,
  onReset,
}: UserFilterProps) {
  const hasFilters = search || grade !== undefined || status || joinFrom || joinTo

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름, 닉네임, 이메일로 검색"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">등급</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onGradeChange(undefined)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                grade === undefined
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(USER_GRADES).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onGradeChange(Number(value))}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  grade === Number(value)
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-border" />

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onStatusChange(undefined)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                status === undefined
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(USER_STATUS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onStatusChange(value as UserStatus)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-border" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={joinFrom}
            onChange={(e) => onJoinFromChange(e.target.value)}
            className="w-[150px]"
            placeholder="가입일 시작"
          />
          <span className="text-muted-foreground">~</span>
          <Input
            type="date"
            value={joinTo}
            onChange={(e) => onJoinToChange(e.target.value)}
            className="w-[150px]"
            placeholder="가입일 종료"
          />
        </div>

        {/* Reset */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-1 h-4 w-4" />
            초기화
          </Button>
        )}
      </div>
    </div>
  )
}
