import {
  FileText,
  Image,
  Archive,
  HelpCircle,
  Video,
  Calendar,
  Vote,
} from 'lucide-react'
import type { BoardType } from '@letmein/types'
import type { BoardFormValues } from './board-form'

// ==================== Board Type Icons ====================

export const BOARD_TYPE_ICONS: Record<BoardType, React.ElementType> = {
  general: FileText,
  gallery: Image,
  archive: Archive,
  qa: HelpCircle,
  video: Video,
  calendar: Calendar,
  vote: Vote,
}

export const BOARD_TYPE_DEFAULT_SKIN: Record<BoardType, string> = {
  general: 'list',
  gallery: 'album',
  archive: 'list',
  qa: 'list',
  video: 'card',
  calendar: 'list',
  vote: 'list',
}

export const BOARD_TYPE_COLORS: Record<BoardType, { border: string; bg: string; text: string; icon: string; badge: string }> = {
  general:  { border: 'border-slate-400',   bg: 'bg-slate-50 dark:bg-slate-900/60',     text: 'text-slate-700 dark:text-slate-300',     icon: 'text-slate-500',   badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  gallery:  { border: 'border-pink-400',    bg: 'bg-pink-50 dark:bg-pink-900/60',       text: 'text-pink-700 dark:text-pink-300',       icon: 'text-pink-500',    badge: 'bg-pink-100 text-pink-600 dark:bg-pink-800 dark:text-pink-400' },
  archive:  { border: 'border-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/60',     text: 'text-amber-700 dark:text-amber-300',     icon: 'text-amber-500',   badge: 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400' },
  qa:       { border: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/60',  text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-400' },
  video:    { border: 'border-red-400',     bg: 'bg-red-50 dark:bg-red-900/60',          text: 'text-red-700 dark:text-red-300',         icon: 'text-red-500',     badge: 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-400' },
  calendar: { border: 'border-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/60',        text: 'text-blue-700 dark:text-blue-300',       icon: 'text-blue-500',    badge: 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400' },
  vote:     { border: 'border-violet-400',  bg: 'bg-violet-50 dark:bg-violet-900/60',    text: 'text-violet-700 dark:text-violet-300',   icon: 'text-violet-500',  badge: 'bg-violet-100 text-violet-600 dark:bg-violet-800 dark:text-violet-400' },
}

export const BOARD_TYPE_PRESETS: Record<BoardType, string[]> = {
  general:  ['리스트형', '댓글', '좋아요'],
  gallery:  ['앨범형', '좋아요', '공유'],
  archive:  ['리스트형', '첨부파일', '댓글'],
  qa:       ['리스트형', '댓글', '대댓글', '좋아요'],
  video:    ['카드형', '좋아요', '공유', '조회수'],
  calendar: ['리스트형', '댓글'],
  vote:     ['리스트형', '좋아요', '댓글'],
}

export const BOARD_TYPE_FORM_PRESETS: Record<BoardType, Partial<BoardFormValues>> = {
  general:  { skin: 'list',  useLike: true, useComment: true, useReply: true, allowAttachment: true },
  gallery:  { skin: 'album', useLike: true, useShare: true, useComment: true },
  archive:  { skin: 'list',  allowAttachment: true, useComment: true, useLike: true },
  qa:       { skin: 'list',  useComment: true, useReply: true, useLike: true },
  video:    { skin: 'card',  useLike: true, useShare: true, useViewCount: true, useComment: true },
  calendar: { skin: 'list',  useComment: true },
  vote:     { skin: 'list',  useLike: true, useComment: true },
}

// ==================== Config Arrays ====================

export const GRADE_FIELDS = [
  { name: 'readGrade', label: '읽기 권한', desc: '게시물을 읽을 수 있는 최소 등급' },
  { name: 'writeGrade', label: '쓰기 권한', desc: '게시물을 작성할 수 있는 최소 등급' },
  { name: 'commentGrade', label: '댓글 권한', desc: '댓글을 작성할 수 있는 최소 등급' },
  { name: 'uploadGrade', label: '업로드 권한', desc: '파일을 업로드할 수 있는 최소 등급' },
  { name: 'likeGrade', label: '좋아요 권한', desc: '좋아요/싫어요를 할 수 있는 최소 등급' },
] as const

export const POST_TOGGLES = [
  { name: 'allowAnonymous', label: '익명 게시 허용', desc: '작성자 이름을 숨기고 글을 작성할 수 있습니다.' },
  { name: 'allowSecret', label: '비밀글 허용', desc: '작성자와 관리자만 읽을 수 있는 비밀글을 작성할 수 있습니다.' },
  { name: 'allowAttachment', label: '첨부파일 허용', desc: '게시물에 파일을 첨부할 수 있습니다.' },
  { name: 'allowSchedule', label: '예약 발행 허용', desc: '지정된 시간에 자동으로 게시물이 발행됩니다.' },
  { name: 'autoBlind', label: '자동 블라인드', desc: '신고 임계치 초과 시 자동으로 블라인드 처리됩니다.' },
] as const

export const INTERACTION_TOGGLES = [
  { name: 'useLike', label: '좋아요', desc: '게시물에 좋아요를 표시할 수 있습니다.' },
  { name: 'useDislike', label: '싫어요', desc: '게시물에 싫어요를 표시할 수 있습니다.' },
  { name: 'useComment', label: '댓글', desc: '게시물에 댓글을 작성할 수 있습니다.' },
  { name: 'useReply', label: '대댓글', desc: '댓글에 답글을 작성할 수 있습니다.' },
  { name: 'useShare', label: '공유', desc: '게시물을 외부에 공유할 수 있습니다.' },
  { name: 'useViewCount', label: '조회수 표시', desc: '게시물의 조회수를 표시합니다.' },
  { name: 'preventCopy', label: '복사 방지', desc: '게시물 텍스트 복사를 방지합니다.' },
  { name: 'watermark', label: '워터마크', desc: '이미지에 워터마크를 추가합니다.' },
] as const

export const FILTER_LEVEL_OPTIONS = [
  { value: 'off', label: '끄기' },
  { value: 'low', label: '낮음' },
  { value: 'normal', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'strict', label: '엄격' },
] as const
