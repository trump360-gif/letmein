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
  Textarea,
} from '@letmein/ui'
import { Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react'
import { formatDateTime } from '@letmein/utils'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/features/admin-manage'
import { RolePermissionEditor } from './role-permission-editor'
import type { AdminRole } from '@letmein/types'

export function RoleManagement() {
  const { data: roles, isLoading } = useRoles()
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()

  const [showCreate, setShowCreate] = useState(false)
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminRole | null>(null)
  const [permissionRoleId, setPermissionRoleId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')

  const openCreate = () => {
    setFormName('')
    setFormDesc('')
    setShowCreate(true)
  }

  const openEdit = (role: AdminRole) => {
    setFormName(role.name)
    setFormDesc(role.description || '')
    setEditingRole(role)
  }

  const handleCreate = async () => {
    if (!formName.trim()) return
    await createMutation.mutateAsync({ name: formName, description: formDesc || undefined })
    setShowCreate(false)
  }

  const handleUpdate = async () => {
    if (!editingRole || !formName.trim()) return
    await updateMutation.mutateAsync({
      id: editingRole.id,
      payload: { name: formName, description: formDesc || undefined },
    })
    setEditingRole(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteMutation.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  if (permissionRoleId) {
    return (
      <RolePermissionEditor
        roleId={permissionRoleId}
        roleName={roles?.find((r) => r.id === permissionRoleId)?.name || ''}
        onBack={() => setPermissionRoleId(null)}
      />
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">역할 관리</CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              역할 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="whitespace-nowrap px-3 py-2">역할명</th>
                  <th className="whitespace-nowrap px-3 py-2">설명</th>
                  <th className="whitespace-nowrap px-3 py-2">권한 수</th>
                  <th className="whitespace-nowrap px-3 py-2">관리자 수</th>
                  <th className="whitespace-nowrap px-3 py-2">생성일</th>
                  <th className="whitespace-nowrap px-3 py-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      로딩 중...
                    </td>
                  </tr>
                ) : !roles?.length ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      등록된 역할이 없습니다.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-muted/50">
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Lock className="mr-0.5 h-3 w-3" />
                              시스템
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">
                        {role.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge variant="outline">{role.permissionCount}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Badge variant="outline">{role.adminCount}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        {formatDateTime(role.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPermissionRoleId(role.id)}
                            title="권한 편집"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          {!role.isSystem && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(role)}
                                title="수정"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(role)}
                                title="삭제"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 역할 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name">역할명 *</Label>
              <Input
                id="role-name"
                placeholder="예: 에디터, 매니저"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role-desc">설명</Label>
              <Textarea
                id="role-desc"
                placeholder="역할에 대한 설명"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? '생성 중...' : '역할 생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">역할명 *</Label>
              <Input
                id="edit-role-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-role-desc">설명</Label>
              <Textarea
                id="edit-role-desc"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formName.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? '저장 중...' : '역할 저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteConfirm?.name}</strong> 역할을 삭제하시겠습니까?
            {deleteConfirm && deleteConfirm.adminCount > 0 && (
              <span className="mt-1 block text-destructive">
                이 역할을 사용하는 관리자가 {deleteConfirm.adminCount}명 있어 삭제할 수 없습니다.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                (deleteConfirm !== null && deleteConfirm.adminCount > 0)
              }
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
