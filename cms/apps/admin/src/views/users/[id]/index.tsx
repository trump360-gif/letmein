'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Star,
  Coins,
  Ban,
  Unlock,
  LogOut,
  Trash2,
  Clock,
} from 'lucide-react'
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import { USER_GRADES } from '@/shared/lib/constants'
import {
  useUserDetail,
  useUnsuspendUser,
  useDeleteUser,
} from '@/features/user-manage'
import { forceLogout } from '@/features/user-manage'
import { UserDetailInfo } from '../components/user-detail-info'
import { UserGradeDialog } from '../components/user-grade-dialog'
import { UserPointDialog } from '../components/user-point-dialog'
import { UserSuspendDialog } from '../components/user-suspend-dialog'

interface UserDetailPageProps {
  userId: number
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
  const router = useRouter()
  const { data: user, isLoading, refetch } = useUserDetail(userId)
  const unsuspend = useUnsuspendUser()
  const deleteUserMutation = useDeleteUser()

  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [pointDialogOpen, setPointDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

  const handleForceLogout = async () => {
    if (!confirm('강제 로그아웃 하시겠습니까?')) return
    try {
      await forceLogout(userId)
      alert('강제 로그아웃 처리되었습니다.')
    } catch {
      alert('강제 로그아웃에 실패했습니다.')
    }
  }

  const handleUnsuspend = async () => {
    if (!confirm('정지를 해제하시겠습니까?')) return
    try {
      await unsuspend.mutateAsync(userId)
      refetch()
    } catch {
      alert('정지 해제에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 이 회원을 탈퇴 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await deleteUserMutation.mutateAsync(userId)
      router.push('/members/users')
    } catch {
      alert('탈퇴 처리에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/members/users')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          로딩 중...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/members/users')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          회원을 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/members/users')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{user.nickname}</h2>
            <p className="text-sm text-muted-foreground">
              ID: {user.id} | {user.email || '이메일 없음'} | {USER_GRADES[user.grade] || `Lv.${user.grade}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setGradeDialogOpen(true)}>
            <Star className="mr-1 h-4 w-4" />
            등급 변경
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPointDialogOpen(true)}>
            <Coins className="mr-1 h-4 w-4" />
            포인트
          </Button>
          {user.status === 'suspended' ? (
            <Button variant="outline" size="sm" onClick={handleUnsuspend} disabled={unsuspend.isPending}>
              <Unlock className="mr-1 h-4 w-4" />
              정지 해제
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setSuspendDialogOpen(true)}>
              <Ban className="mr-1 h-4 w-4" />
              계정 정지
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleForceLogout}>
            <LogOut className="mr-1 h-4 w-4" />
            강제 로그아웃
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteUserMutation.isPending}>
            <Trash2 className="mr-1 h-4 w-4" />
            탈퇴
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="grade-history">등급 이력</TabsTrigger>
          <TabsTrigger value="points">포인트 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <UserDetailInfo user={user} />
        </TabsContent>

        <TabsContent value="grade-history">
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">일시</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">이전 등급</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">변경 등급</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">사유</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">변경자</th>
                  </tr>
                </thead>
                <tbody>
                  {user.recentGradeHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        등급 변경 이력이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    user.recentGradeHistory.map((h) => (
                      <tr key={h.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(h.createdAt), 'yyyy.MM.dd HH:mm')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {USER_GRADES[h.fromGrade] || `Lv.${h.fromGrade}`}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {USER_GRADES[h.toGrade] || `Lv.${h.toGrade}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{h.reason || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {h.changerNickname || '시스템'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="points">
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">일시</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">구분</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">변동</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">잔액</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">비고</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">만료일</th>
                  </tr>
                </thead>
                <tbody>
                  {user.recentPoints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        포인트 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    user.recentPoints.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(p.createdAt), 'yyyy.MM.dd HH:mm')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{p.type}</td>
                        <td className={`px-4 py-3 text-right font-mono font-medium ${p.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {p.amount > 0 ? '+' : ''}{p.amount.toLocaleString()} P
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {p.balance.toLocaleString()} P
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.note || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.expiresAt ? format(new Date(p.expiresAt), 'yyyy.MM.dd') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserGradeDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        userId={user.id}
        currentGrade={user.grade}
        userNickname={user.nickname}
      />
      <UserPointDialog
        open={pointDialogOpen}
        onOpenChange={setPointDialogOpen}
        userId={user.id}
        currentPoints={user.points}
        userNickname={user.nickname}
      />
      <UserSuspendDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userId={user.id}
        userNickname={user.nickname}
      />
    </div>
  )
}
