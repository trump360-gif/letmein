'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useDoctorsQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useUpdateDoctorOrderMutation,
  type Doctor,
} from '@/features/hospital-portal/doctors'

// -----------------------------------------------------------------------
// Sortable doctor card
// -----------------------------------------------------------------------

interface SortableDoctorCardProps {
  doctor: Doctor
  onEdit: (doctor: Doctor) => void
  onDelete: (id: string) => void
}

function SortableDoctorCard({ doctor, onEdit, onDelete }: SortableDoctorCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: doctor.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-gray-400 hover:text-gray-600 focus:outline-none active:cursor-grabbing"
        aria-label="순서 조정"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* 의사 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{doctor.name}</p>
        {doctor.title && (
          <p className="truncate text-sm text-gray-500">{doctor.title}</p>
        )}
        {doctor.experience && (
          <p className="truncate text-xs text-gray-400">{doctor.experience}</p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(doctor)}
          className="rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(doctor.id)}
          className="rounded px-3 py-1 text-sm text-red-500 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------
// Inline edit card
// -----------------------------------------------------------------------

interface EditDoctorCardProps {
  doctor: Doctor
  onSave: (id: string, data: { name: string; title: string; experience: string }) => void
  onCancel: () => void
  isSaving: boolean
}

function EditDoctorCard({ doctor, onSave, onCancel, isSaving }: EditDoctorCardProps) {
  const [name, setName] = useState(doctor.name)
  const [title, setTitle] = useState(doctor.title ?? '')
  const [experience, setExperience] = useState(doctor.experience ?? '')
  const [nameError, setNameError] = useState('')

  function handleSave() {
    if (!name.trim()) {
      setNameError('이름을 입력해 주세요')
      return
    }
    setNameError('')
    onSave(doctor.id, { name: name.trim(), title, experience })
  }

  return (
    <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">전문분야</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="전문분야 / 직함 (선택)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">경력</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="경력 사항 (선택)"
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------

export default function HospitalDoctorsView() {
  const { data, isLoading, error } = useDoctorsQuery()
  const createMutation = useCreateDoctorMutation()
  const updateMutation = useUpdateDoctorMutation()
  const deleteMutation = useDeleteDoctorMutation()
  const orderMutation = useUpdateDoctorOrderMutation()

  // 추가 폼 상태
  const [addName, setAddName] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [addExperience, setAddExperience] = useState('')
  const [addNameError, setAddNameError] = useState('')

  // 수정 중인 의사 ID
  const [editingId, setEditingId] = useState<string | null>(null)

  // 로컬 정렬 상태 (DnD 즉각 반영용)
  const [localDoctors, setLocalDoctors] = useState<Doctor[] | null>(null)
  const doctors = localDoctors ?? data?.doctors ?? []

  // 서버 데이터가 갱신되면 로컬 상태 초기화
  if (data && localDoctors === null) {
    // React state managed externally — intentionally not calling set here
    // Will be sync'd on next render via the null check above
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // 추가 핸들러
  function handleAdd() {
    if (!addName.trim()) {
      setAddNameError('이름을 입력해 주세요')
      return
    }
    setAddNameError('')
    createMutation.mutate(
      { name: addName.trim(), title: addTitle || undefined, experience: addExperience || undefined },
      {
        onSuccess: () => {
          setAddName('')
          setAddTitle('')
          setAddExperience('')
          setLocalDoctors(null)
        },
      },
    )
  }

  // 수정 저장 핸들러
  function handleEditSave(id: string, editData: { name: string; title: string; experience: string }) {
    updateMutation.mutate(
      { id, data: { name: editData.name, title: editData.title || null, experience: editData.experience || null } },
      {
        onSuccess: () => {
          setEditingId(null)
          setLocalDoctors(null)
        },
      },
    )
  }

  // 삭제 핸들러
  function handleDelete(id: string) {
    if (!window.confirm('이 의료진을 삭제하시겠습니까?')) return
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setLocalDoctors(null)
      },
    })
  }

  // DnD 완료 핸들러
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = doctors.findIndex((d) => d.id === active.id)
    const newIndex = doctors.findIndex((d) => d.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(doctors, oldIndex, newIndex)
    setLocalDoctors(reordered)

    const orders = reordered.map((d, idx) => ({ id: Number(d.id), sortOrder: idx }))
    orderMutation.mutate(orders, {
      onSuccess: () => {
        setLocalDoctors(null)
      },
      onError: () => {
        // 오류 시 로컬 상태 롤백
        setLocalDoctors(null)
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-xl font-bold text-gray-900">의료진 관리</h1>

      {/* 의료진 추가 섹션 — 항상 펼쳐진 상태 */}
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">의료진 추가</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="의료진 이름"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {addNameError && <p className="mt-1 text-xs text-red-500">{addNameError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">전문분야</label>
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="전문분야 / 직함 (선택)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">경력</label>
            <textarea
              value={addExperience}
              onChange={(e) => setAddExperience(e.target.value)}
              placeholder="경력 사항 (선택)"
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={createMutation.isPending}
              className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? '추가 중...' : '추가'}
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-500">
              {createMutation.error?.message ?? '추가에 실패했습니다'}
            </p>
          )}
        </div>
      </section>

      {/* 의료진 목록 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-800">
          의료진 목록{data ? ` (${doctors.length}명)` : ''}
        </h2>

        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
        )}

        {error && (
          <p className="py-8 text-center text-sm text-red-500">
            {error instanceof Error ? error.message : '목록을 불러오지 못했습니다'}
          </p>
        )}

        {!isLoading && !error && doctors.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            등록된 의료진이 없습니다. 위 폼으로 추가해 주세요.
          </p>
        )}

        {doctors.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={doctors.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {doctors.map((doctor) =>
                  editingId === doctor.id ? (
                    <EditDoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onSave={handleEditSave}
                      onCancel={() => setEditingId(null)}
                      isSaving={updateMutation.isPending}
                    />
                  ) : (
                    <SortableDoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onEdit={(d) => setEditingId(d.id)}
                      onDelete={handleDelete}
                    />
                  ),
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {orderMutation.isPending && (
          <p className="mt-2 text-center text-xs text-gray-400">순서 저장 중...</p>
        )}
        {orderMutation.isError && (
          <p className="mt-2 text-center text-xs text-red-500">순서 저장에 실패했습니다</p>
        )}
      </section>
    </div>
  )
}
