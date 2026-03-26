'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
} from '@letmein/ui'
import { Plus, Trash2, UserCog } from 'lucide-react'
import { formatDateTime } from '@letmein/utils'
import {
  useAdmins,
  useRoles,
  useCreateAdmin,
  useChangeAdminRole,
  useDeleteAdmin,
} from '@/features/admin-manage'
import type { AdminUserDetail } from '@letmein/types'

export function AdminList() {
  const [page, setPage] = useState(1)
  const { data: adminData, isLoading } = useAdmins({ page, limit: 20 })
  const { data: roles } = useRoles()
  const createMutation = useCreateAdmin()
  const changeRoleMutation = useChangeAdminRole()
  const deleteMutation = useDeleteAdmin()

  const [showCreate, setShowCreate] = useState(false)
  const [changeRoleTarget, setChangeRoleTarget] = useState<AdminUserDetail | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserDetail | null>(null)

  // Create form
  const [createUserId, setCreateUserId] = useState('')
  const [createRoleId, setCreateRoleId] = useState('')

  // Change role form
  const [newRoleId, setNewRoleId] = useState('')

  const openCreate = () => {
    setCreateUserId('')
    setCreateRoleId(roles?.[0]?.id || '')
    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!createUserId || !createRoleId) return
    await createMutation.mutateAsync({
      userId: Number(createUserId),
      roleId: createRoleId,
    })
    setShowCreate(false)
  }

  const openChangeRole = (admin: AdminUserDetail) => {
    setNewRoleId(admin.roleId)
    setChangeRoleTarget(admin)
  }

  const handleChangeRole = async () => {
    if (!changeRoleTarget || !newRoleId) return
    await changeRoleMutation.mutateAsync({
      id: changeRoleTarget.id,
      payload: { roleId: newRoleId },
    })
    setChangeRoleTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">관리자 목록</CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              관리자 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="whitespace-nowrap px-3 py-2">관리자</th>
                  <th className="whitespace-nowrap px-3 py-2">역할</th>
                  <th className="whitespace-nowrap px-3 py-2">2FA</th>
                  <th className="whitespace-nowrap px-3 py-2">IP 허용</th>
                  <th className="whitespace-nowrap px-3 py-2">마지막 로그인</th>
                  <th className="whitespace-nowrap px-3 py-2">등록일</th>
                  <th className="whitespace-nowrap px-3 py-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      로딩 중...
                    </td>
                  </tr>
                ) : !adminData?.data?.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      등록된 관리자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  adminData.data.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-muted/50">
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="font-medium">{admin.nickname}</div>
                        <div className="text-xs text-muted-foreground">{admin.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge variant="secondary">{admin.roleName}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {admin.totpEnabled ? (
                          <Badge variant="default" className="text-[10px]">활성</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">비활성</Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        {admin.ipWhitelist?.length
                          ? admin.ipWhitelist.join(', ')
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        {admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        {formatDateTime(admin.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openChangeRole(admin)}
                            title="역할 변경"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(admin)}
                            title="제거"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {adminData?.meta && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                총 {adminData.meta.total}건 (페이지 {adminData.meta.page}/{Math.ceil(adminData.meta.total / adminData.meta.limit) || 1})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!adminData.meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-user-id">사용자 ID *</Label>
              <Input
                id="admin-user-id"
                type="number"
                placeholder="기존 회원의 사용자 ID"
                value={createUserId}
                onChange={(e) => setCreateUserId(e.target.value)}
              />
            </div>
            <div>
              <Label>역할 *</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {roles?.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setCreateRoleId(r.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      createRoleId === r.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createUserId || !createRoleId || createMutation.isPending}
            >
              {createMutation.isPending ? '추가 중...' : '관리자 추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!changeRoleTarget} onOpenChange={(open) => !open && setChangeRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{changeRoleTarget?.nickname}</strong> ({changeRoleTarget?.email})의 역할을 변경합니다.
            </p>
            <div>
              <Label>새 역할</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {roles?.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setNewRoleId(r.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      newRoleId === r.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleTarget(null)}>
              취소
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? '변경 중...' : '역할 변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 제거</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteTarget?.nickname}</strong> ({deleteTarget?.email})를 관리자에서 제거하시겠습니까?
            <br />
            <span className="text-xs">회원 계정 자체는 삭제되지 않습니다.</span>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '제거 중...' : '제거'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
