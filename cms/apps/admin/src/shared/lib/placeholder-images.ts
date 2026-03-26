/**
 * SVG Placeholder 이미지 생성기
 * 뷰티/의료 테마에 맞는 placeholder 이미지를 data URI로 생성
 */

// ==================== SVG 생성 헬퍼 ====================

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

// ==================== 히어로 배너 ====================

export function heroPlaceholder(
  width = 1200,
  height = 360,
  options?: { gradient?: [string, string]; text?: string },
): string {
  const [from, to] = options?.gradient ?? ['#e8d5c4', '#c9a88a']
  const text = options?.text ?? 'BEAUTY'
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${from}"/>
          <stop offset="100%" style="stop-color:${to}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="72" font-weight="200"
        fill="white" opacity="0.4" letter-spacing="24">${text}</text>
      <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="16" font-weight="300"
        fill="white" opacity="0.5">Placeholder Image</text>
    </svg>
  `)
}

// ==================== 프로필 아바타 ====================

export function avatarPlaceholder(
  size = 200,
  options?: { name?: string; bgColor?: string },
): string {
  const bg = options?.bgColor ?? '#E4D4C8'
  const initial = options?.name?.charAt(0) ?? '?'
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${size / 2}" fill="${bg}"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="${size * 0.4}" font-weight="600"
        fill="white">${initial}</text>
    </svg>
  `)
}

// ==================== 일반 이미지 ====================

export function imagePlaceholder(
  width = 400,
  height = 300,
  options?: { label?: string; bgColor?: string; iconEmoji?: string },
): string {
  const bg = options?.bgColor ?? '#F4F4F5'
  const label = options?.label ?? `${width}×${height}`
  const emoji = options?.iconEmoji ?? '🖼'
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${bg}"/>
      <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle"
        font-size="32">${emoji}</text>
      <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="12" fill="#A1A1AA">${label}</text>
    </svg>
  `)
}

// ==================== 미리 정의된 히어로 배너 세트 ====================

export const HERO_PLACEHOLDERS = {
  beauty: heroPlaceholder(1200, 360, {
    gradient: ['#e8d5c4', '#c9a88a'],
    text: 'BEAUTY',
  }),
  skincare: heroPlaceholder(1200, 360, {
    gradient: ['#fce4ec', '#f8bbd0'],
    text: 'SKINCARE',
  }),
  clinic: heroPlaceholder(1200, 360, {
    gradient: ['#e3f2fd', '#90caf9'],
    text: 'CLINIC',
  }),
} as const

// ==================== 미리 정의된 의사 아바타 세트 ====================

const DOCTOR_COLORS = ['#B8A9C9', '#A8C4B8', '#C4A8A8', '#A8B4C4']

export function doctorAvatar(name: string, index: number): string {
  return avatarPlaceholder(200, {
    name,
    bgColor: DOCTOR_COLORS[index % DOCTOR_COLORS.length],
  })
}
