import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// Chosung mapping for Korean
const CHOSUNG_MAP: Record<string, string> = {
  'ㄱ': '[가-깋]', 'ㄲ': '[까-낗]', 'ㄴ': '[나-닣]', 'ㄷ': '[다-딯]',
  'ㄸ': '[따-띻]', 'ㄹ': '[라-맇]', 'ㅁ': '[마-밓]', 'ㅂ': '[바-빟]',
  'ㅃ': '[빠-삫]', 'ㅅ': '[사-싷]', 'ㅆ': '[싸-앃]', 'ㅇ': '[아-잏]',
  'ㅈ': '[자-짛]', 'ㅉ': '[짜-찧]', 'ㅊ': '[차-칳]', 'ㅋ': '[카-킿]',
  'ㅌ': '[타-팋]', 'ㅍ': '[파-핗]', 'ㅎ': '[하-힣]',
}

function chosungToRegex(chosung: string): RegExp {
  let pattern = ''
  for (const ch of chosung) {
    if (CHOSUNG_MAP[ch]) {
      pattern += CHOSUNG_MAP[ch]
    } else {
      pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(pattern, 'g')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, boardId } = body

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '테스트할 텍스트를 입력해주세요.' },
        },
        { status: 400 },
      )
    }

    const where: Record<string, unknown> = { isActive: true }
    if (boardId) {
      where.OR = [
        { boardId: null },
        { boardId: BigInt(boardId) },
      ]
    } else {
      where.boardId = null
    }

    const bannedWords = await prisma.bannedWord.findMany({ where })

    const matches: Array<{
      word: string
      patternType: string
      action: string
      positions: Array<{ start: number; end: number }>
    }> = []

    let filteredText = text

    for (const bw of bannedWords) {
      let regex: RegExp

      try {
        if (bw.patternType === 'direct') {
          const escaped = bw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          regex = new RegExp(escaped, 'gi')
        } else if (bw.patternType === 'regex') {
          regex = new RegExp(bw.word, 'gi')
        } else if (bw.patternType === 'chosung') {
          regex = chosungToRegex(bw.word)
        } else {
          continue
        }
      } catch {
        continue
      }

      const positions: Array<{ start: number; end: number }> = []
      let match: RegExpExecArray | null

      // Reset lastIndex
      regex.lastIndex = 0

      while ((match = regex.exec(text)) !== null) {
        positions.push({ start: match.index, end: match.index + match[0].length })
        // Prevent infinite loops on zero-length matches
        if (match[0].length === 0) regex.lastIndex++
      }

      if (positions.length > 0) {
        matches.push({
          word: bw.word,
          patternType: bw.patternType,
          action: bw.action,
          positions,
        })

        // Apply replacement for preview
        if (bw.action === 'replace') {
          regex.lastIndex = 0
          filteredText = filteredText.replace(regex, (m: string) => '*'.repeat(m.length))
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        matched: matches.length > 0,
        matches,
        filteredText,
      },
    })
  } catch (error) {
    console.error('Failed to test banned words:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '금칙어 테스트에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
