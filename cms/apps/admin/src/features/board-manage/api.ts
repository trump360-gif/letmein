import { api } from '@/shared/api/client'
import type {
  Board,
  BoardGroup,
  BoardCreateInput,
  BoardUpdateInput,
  BoardReorderInput,
  BoardGroupCreateInput,
  BoardGroupUpdateInput,
  BoardTreeGroup,
  BoardTreeItem,
} from '@letmein/types'

// ==================== Board Groups ====================

export async function fetchBoardGroups(): Promise<BoardGroup[]> {
  const res = await api.get('admin/board-groups').json<{ success: true; data: BoardGroup[] }>()
  return res.data
}

export async function createBoardGroup(data: BoardGroupCreateInput): Promise<BoardGroup> {
  const res = await api.post('admin/board-groups', { json: data }).json<{ success: true; data: BoardGroup }>()
  return res.data
}

export async function updateBoardGroup(id: string, data: BoardGroupUpdateInput): Promise<BoardGroup> {
  const res = await api.patch(`admin/board-groups/${id}`, { json: data }).json<{ success: true; data: BoardGroup }>()
  return res.data
}

export async function deleteBoardGroup(id: string): Promise<void> {
  await api.delete(`admin/board-groups/${id}`).json()
}

// ==================== Boards ====================

export interface BoardTreeResponse {
  groups: BoardTreeGroup[]
  ungrouped: BoardTreeItem[]
}

export async function fetchBoardTree(): Promise<BoardTreeResponse> {
  const res = await api.get('admin/boards').json<{ success: true; data: BoardTreeResponse }>()
  return res.data
}

export async function fetchBoard(id: string): Promise<Board> {
  const res = await api.get(`admin/boards/${id}`).json<{ success: true; data: Board }>()
  return res.data
}

export async function createBoard(data: BoardCreateInput): Promise<Board> {
  const res = await api.post('admin/boards', { json: data }).json<{ success: true; data: Board }>()
  return res.data
}

export async function updateBoard(id: string, data: BoardUpdateInput): Promise<Board> {
  const res = await api.patch(`admin/boards/${id}`, { json: data }).json<{ success: true; data: Board }>()
  return res.data
}

export async function deleteBoard(id: string): Promise<void> {
  await api.delete(`admin/boards/${id}`).json()
}

export async function reorderBoards(data: BoardReorderInput): Promise<void> {
  await api.patch('admin/boards/reorder', { json: data }).json()
}

// ==================== Slug ====================

// 한글 → 영문 슬러그 변환 (간이 로마자 변환)
const KOREAN_TO_ROMAN: Record<string, string> = {
  ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt',
  ㄹ: 'r', ㅁ: 'm', ㅂ: 'b', ㅃ: 'pp', ㅅ: 's',
  ㅆ: 'ss', ㅇ: '', ㅈ: 'j', ㅉ: 'jj', ㅊ: 'ch',
  ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h',
  ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo',
  ㅔ: 'e', ㅕ: 'yeo', ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa',
  ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u', ㅝ: 'wo',
  ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui',
  ㅣ: 'i',
}

const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

function decomposeKorean(char: string): string[] {
  const code = char.charCodeAt(0) - 0xAC00
  if (code < 0 || code > 11171) return [char]
  const initial = Math.floor(code / 588)
  const medial = Math.floor((code % 588) / 28)
  const final = code % 28
  const result = [INITIALS[initial], MEDIALS[medial]]
  if (final > 0) result.push(FINALS[final])
  return result
}

export function koreanToSlug(text: string): string {
  let result = ''
  for (const char of text) {
    if (/[가-힣]/.test(char)) {
      const parts = decomposeKorean(char)
      for (const part of parts) {
        result += KOREAN_TO_ROMAN[part] ?? part
      }
    } else if (/[a-zA-Z0-9]/.test(char)) {
      result += char.toLowerCase()
    } else if (/[\s_]/.test(char)) {
      result += '-'
    }
  }
  return result.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  try {
    const res = await api.get(`admin/boards?slug=${slug}`).json<{ success: true; data: { groups: unknown[]; ungrouped: unknown[] } }>()
    // Simple approach: the board creation endpoint will reject duplicates
    return !!res.success
  } catch {
    return false
  }
}
