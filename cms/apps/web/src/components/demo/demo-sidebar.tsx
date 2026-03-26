'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSidebar } from './sidebar-context'
import { Centrifuge } from 'centrifuge'
import { Activity, Bot, Play, Square } from 'lucide-react'

interface DemoEvent {
  id: string
  type: string        // 'post' | '댓글' | '대댓글' | '대대댓글'
  persona_id: string
  name: string
  archetype: string
  detail: string
  board?: string
  post_id?: string
  ts: string
  _at?: number        // unix ms, 만료 처리용
}

const TYPE_LABEL: Record<string, string> = {
  post:   '글 작성',
  댓글:   '댓글',
  대댓글: '대댓글',
  대대댓글: '대대댓글',
}

const TYPE_COLOR: Record<string, string> = {
  post:   'text-[#6B2D3C]',
  댓글:   'text-[#2D6B3C]',
  대댓글: 'text-[#2D3C6B]',
  대대댓글: 'text-[#6B5B2D]',
}

const BOARD_LABEL: Record<string, string> = {
  'surgery-review':     '성형후기',
  'hospital-recommend': '병원추천',
  'eye-nose':           '눈·코·윤곽',
  'skin-laser':         '피부·레이저',
  'body-fat':           '지방·체형',
  'consultation':       '상담·질문',
  'free':               '자유',
}

const ACTIVE_EXPIRE_MS = 30 * 60 * 1000  // 30분

const BOT_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || ''

export function DemoSidebar() {
  const { isOpen, setIsOpen } = useSidebar()
  const [logs, setLogs] = useState<DemoEvent[]>([])
  const [activePersonas, setActivePersonas] = useState<Record<string, DemoEvent>>({})
  const [totalCount, setTotalCount] = useState(0)
  const [flash, setFlash] = useState(false)
  const [botRunning, setBotRunning] = useState(false)
  const [autoStopAt, setAutoStopAt] = useState<string | null>(null)
  const [controlling, setControlling] = useState(false)

  // 봇 상태 조회
  const fetchBotStatus = useCallback(() => {
    fetch('/api/bot/status')
      .then((r) => r.json())
      .then((d) => {
        setBotRunning(d.running ?? false)
        setAutoStopAt(d.auto_stop_at ?? null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchBotStatus()
    const iv = setInterval(fetchBotStatus, 30_000)  // 30초마다 폴링
    return () => clearInterval(iv)
  }, [fetchBotStatus])

  // 봇 제어 (run/stop)
  const controlBot = async (action: 'start' | 'stop') => {
    setControlling(true)
    try {
      const resp = await fetch('/api/bot/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BOT_SECRET}`,
        },
        body: JSON.stringify({ action }),
      })
      if (resp.ok) {
        const d = await resp.json()
        setBotRunning(d.status === 'running')
        setAutoStopAt(d.auto_stop_at ?? null)
      }
    } catch (_) { /* ignore */ }
    setControlling(false)
  }

  // 봇 활동 로드 (초기 + 30초 폴링)
  const fetchActivity = useCallback(() => {
    fetch('/api/bot-activity?hours=24&limit=150')
      .then((r) => r.json())
      .then(({ events }) => {
        if (!Array.isArray(events) || events.length === 0) return
        setLogs(events)
        const personaMap: Record<string, DemoEvent> = {}
        for (const e of [...events].reverse()) {
          personaMap[e.name] = { ...e, persona_id: e.name }
        }
        setActivePersonas(personaMap)
        setTotalCount(events.length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchActivity()
    const iv = setInterval(fetchActivity, 30_000)
    return () => clearInterval(iv)
  }, [fetchActivity])

  // Centrifugo 실시간 구독
  useEffect(() => {
    const centrifuge = new Centrifuge(process.env.NEXT_PUBLIC_CENTRIFUGO_WS_URL || 'wss://ws.codeb.kr/connection/websocket', {
      token: '',
    })

    const sub = centrifuge.newSubscription('demo:activity')

    sub.on('publication', ({ data }) => {
      const now = Date.now()
      const event: DemoEvent = {
        id: `${now}-${Math.random()}`,
        ...data,
        _at: now,
      }
      setLogs((prev) => [event, ...prev.slice(0, 199)])
      setActivePersonas((prev) => ({ ...prev, [data.persona_id]: event }))
      setTotalCount((c) => c + 1)
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
    })

    sub.subscribe()
    centrifuge.connect()

    return () => {
      sub.unsubscribe()
      centrifuge.disconnect()
    }
  }, [])

  const activeList = Object.values(activePersonas).filter(
    (p) => !p._at || Date.now() - p._at < ACTIVE_EXPIRE_MS
  )

  if (!isOpen) return null

  return (
    <div className="hidden lg:flex fixed right-0 top-0 h-screen z-50 w-[260px] transition-all duration-300">
      {/* 사이드바 패널 */}
      <div className="flex flex-1 flex-col overflow-hidden border-l border-[#E0E0E0] bg-[#FAFAFA] shadow-lg">
          {/* 헤더 */}
          <div
            className={`flex items-center gap-2 border-b border-[#1A1A1A] bg-[#0A0A0A] px-3 py-2.5 transition-colors ${
              flash ? 'bg-[#1A1A1A]' : ''
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${botRunning ? 'animate-pulse text-[#FF6B6B]' : 'text-[#555]'}`} />
            <span className="text-[12px] font-medium tracking-wide text-white">AI 봇 활동 현황</span>
            <span className="ml-auto rounded-full bg-[#1A1A1A] px-2 py-0.5 text-[10px] text-[#888]">
              {activeList.length}명
            </span>
          </div>

          {/* Run/Stop 컨트롤 */}
          <div className="flex items-center gap-2 border-b border-[#E8E8E8] px-3 py-2">
            <div className={`h-2 w-2 rounded-full ${botRunning ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-[11px] text-[#555]">{botRunning ? '실행 중' : '정지됨'}</span>
            {autoStopAt && botRunning && (
              <span className="ml-1 text-[9px] text-[#AAAAAA]">
                ~{new Date(autoStopAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}까지
              </span>
            )}
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => controlBot('start')}
                disabled={botRunning || controlling}
                className="flex items-center gap-1 rounded bg-[#0A0A0A] px-2 py-1 text-[10px] text-white disabled:opacity-40 hover:bg-[#333] transition-colors"
              >
                <Play className="h-2.5 w-2.5" />
                Run
              </button>
              <button
                onClick={() => controlBot('stop')}
                disabled={!botRunning || controlling}
                className="flex items-center gap-1 rounded bg-[#CC3333] px-2 py-1 text-[10px] text-white disabled:opacity-40 hover:bg-[#AA2222] transition-colors"
              >
                <Square className="h-2.5 w-2.5" />
                Stop
              </button>
            </div>
          </div>

          {/* 활동 중인 페르소나 뱃지 */}
          {activeList.length > 0 && (
            <div className="border-b border-[#E8E8E8] px-3 py-2">
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#AAAAAA]">
                활동중
              </p>
              <div className="flex flex-wrap gap-1">
                {activeList.slice(0, 10).map((p) => (
                  <span
                    key={p.persona_id}
                    className="rounded-full bg-[#0A0A0A] px-2 py-0.5 text-[10px] text-white"
                    title={p.archetype}
                  >
                    {p.name}
                  </span>
                ))}
                {activeList.length > 10 && (
                  <span className="rounded-full bg-[#E8E8E8] px-2 py-0.5 text-[10px] text-[#888]">
                    +{activeList.length - 10}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 실시간 로그 스트림 */}
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Bot className="h-6 w-6 text-[#DDDDDD]" />
                <p className="text-[12px] text-[#CCCCCC]">봇 활동 대기 중</p>
                <p className="text-[10px] text-[#DDDDDD]">Run 버튼으로 시작</p>
              </div>
            ) : (
              <div>
                {logs.map((log, i) => (
                  <div
                    key={log.id}
                    className={`border-b border-[#F0F0F0] px-3 py-2 transition-colors ${
                      i === 0 ? 'bg-[#FFF8F8]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#222]">{log.name}</span>
                      <span
                        className={`text-[10px] font-medium ${
                          TYPE_COLOR[log.type] ?? 'text-[#888]'
                        }`}
                      >
                        {TYPE_LABEL[log.type] ?? log.type}
                      </span>
                      {log.board && (
                        <span className="rounded bg-[#F0F0F0] px-1.5 py-0.5 text-[9px] text-[#666]">
                          {BOARD_LABEL[log.board] ?? log.board}
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-[10px] text-[#CCCCCC]">{log.ts}</span>
                    </div>
                    {log.post_id ? (
                      <a
                        href={`/${log.board ?? 'free'}/${log.post_id}`}
                        className="mt-0.5 block truncate pl-0 text-[11px] leading-snug text-[#888] underline-offset-2 hover:text-[#6B2D3C] hover:underline"
                      >
                        {log.detail}
                      </a>
                    ) : (
                      <p className="mt-0.5 truncate pl-0 text-[11px] leading-snug text-[#888]">
                        {log.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터: 총 액션 수 */}
          {totalCount > 0 && (
            <div className="border-t border-[#E8E8E8] bg-[#F5F5F5] px-3 py-1.5 text-center">
              <span className="text-[10px] text-[#AAAAAA]">총 {totalCount}건 활동</span>
            </div>
          )}
      </div>
    </div>
  )
}
