'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import { ArrowLeft, Save } from 'lucide-react'
import { useRolePermissions, useUpdateRolePermissions } from '@/features/admin-manage'
import { ADMIN_MODULES } from '@letmein/types'

interface RolePermissionEditorProps {
  roleId: string
  roleName: string
  onBack: () => void
}

interface PermissionRow {
  module: string
  label: string
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
}

export function RolePermissionEditor({ roleId, roleName, onBack }: RolePermissionEditorProps) {
  const { data: permissions, isLoading } = useRolePermissions(roleId)
  const updateMutation = useUpdateRolePermissions()
  const [rows, setRows] = useState<PermissionRow[]>([])

  useEffect(() => {
    // Initialize rows from modules, merging with existing permissions
    const permMap = new Map(
      (permissions || []).map((p) => [p.module, p]),
    )

    setRows(
      ADMIN_MODULES.map((m) => {
        const existing = permMap.get(m.key)
        return {
          module: m.key,
          label: m.label,
          canRead: existing?.canRead ?? false,
          canWrite: existing?.canWrite ?? false,
          canDelete: existing?.canDelete ?? false,
        }
      }),
    )
  }, [permissions])

  const toggleAll = (field: 'canRead' | 'canWrite' | 'canDelete') => {
    const allChecked = rows.every((r) => r[field])
    setRows(rows.map((r) => ({ ...r, [field]: !allChecked })))
  }

  const toggleRow = (module: string, field: 'canRead' | 'canWrite' | 'canDelete') => {
    setRows(
      rows.map((r) =>
        r.module === module ? { ...r, [field]: !r[field] } : r,
      ),
    )
  }

  const toggleRowAll = (module: string) => {
    const row = rows.find((r) => r.module === module)
    if (!row) return
    const allChecked = row.canRead && row.canWrite && row.canDelete
    setRows(
      rows.map((r) =>
        r.module === module
          ? { ...r, canRead: !allChecked, canWrite: !allChecked, canDelete: !allChecked }
          : r,
      ),
    )
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      roleId,
      payload: {
        permissions: rows
          .filter((r) => r.canRead || r.canWrite || r.canDelete)
          .map((r) => ({
            module: r.module,
            canRead: r.canRead,
            canWrite: r.canWrite,
            canDelete: r.canDelete,
          })),
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              권한 편집 - <span className="text-primary">{roleName}</span>
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save className="mr-1 h-4 w-4" />
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-3 py-2 font-medium">모듈</th>
                  <th className="px-3 py-2 text-center font-medium">
                    <button
                      className="underline-offset-4 hover:underline"
                      onClick={() => toggleAll('canRead')}
                    >
                      읽기
                    </button>
                  </th>
                  <th className="px-3 py-2 text-center font-medium">
                    <button
                      className="underline-offset-4 hover:underline"
                      onClick={() => toggleAll('canWrite')}
                    >
                      쓰기
                    </button>
                  </th>
                  <th className="px-3 py-2 text-center font-medium">
                    <button
                      className="underline-offset-4 hover:underline"
                      onClick={() => toggleAll('canDelete')}
                    >
                      삭제
                    </button>
                  </th>
                  <th className="px-3 py-2 text-center font-medium">전체</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const allChecked = row.canRead && row.canWrite && row.canDelete
                  return (
                    <tr key={row.module} className="border-b hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{row.label}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.canRead}
                          onChange={() => toggleRow(row.module, 'canRead')}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.canWrite}
                          onChange={() => toggleRow(row.module, 'canWrite')}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.canDelete}
                          onChange={() => toggleRow(row.module, 'canDelete')}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={() => toggleRowAll(row.module)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className="mt-3 text-sm text-green-600">권한이 저장되었습니다.</div>
        )}
        {updateMutation.isError && (
          <div className="mt-3 text-sm text-destructive">권한 저장에 실패했습니다.</div>
        )}
      </CardContent>
    </Card>
  )
}
