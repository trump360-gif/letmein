/**
 * 뷰티/의료 테마 아이콘 셋
 * 카테고리, 통계, 섹션 등에서 사용하는 아이콘 정의
 */

// ==================== 이모지 아이콘 카테고리 ====================

export interface IconOption {
  value: string
  label: string
  category: string
}

/** 뷰티/의료 이모지 아이콘 셋 */
export const BEAUTY_ICONS: IconOption[] = [
  // 시술/의료
  { value: '💉', label: '주사', category: '시술' },
  { value: '🏥', label: '병원', category: '시술' },
  { value: '⚕️', label: '의료', category: '시술' },
  { value: '🩺', label: '진료', category: '시술' },
  { value: '💊', label: '약', category: '시술' },
  { value: '🔬', label: '검사', category: '시술' },
  { value: '🩹', label: '치료', category: '시술' },
  { value: '🧬', label: 'DNA', category: '시술' },

  // 뷰티/스킨케어
  { value: '✨', label: '피부관리', category: '뷰티' },
  { value: '💎', label: '프리미엄', category: '뷰티' },
  { value: '🌸', label: '꽃', category: '뷰티' },
  { value: '🧴', label: '스킨케어', category: '뷰티' },
  { value: '💄', label: '메이크업', category: '뷰티' },
  { value: '🪞', label: '거울', category: '뷰티' },
  { value: '🧖', label: '스파', category: '뷰티' },
  { value: '💆', label: '마사지', category: '뷰티' },
  { value: '🌿', label: '자연', category: '뷰티' },
  { value: '🫧', label: '버블', category: '뷰티' },
  { value: '🧊', label: '쿨링', category: '뷰티' },

  // 부위별
  { value: '👁️', label: '눈', category: '부위' },
  { value: '👃', label: '코', category: '부위' },
  { value: '👄', label: '입술', category: '부위' },
  { value: '🦷', label: '치아', category: '부위' },
  { value: '🦴', label: '뼈', category: '부위' },
  { value: '💪', label: '바디', category: '부위' },
  { value: '🦵', label: '다리', category: '부위' },
  { value: '✋', label: '손', category: '부위' },

  // 일반
  { value: '⭐', label: '인기', category: '일반' },
  { value: '🔥', label: '핫딜', category: '일반' },
  { value: '📋', label: '리스트', category: '일반' },
  { value: '📝', label: '후기', category: '일반' },
  { value: '❓', label: '질문', category: '일반' },
  { value: '📢', label: '공지', category: '일반' },
  { value: '🎁', label: '이벤트', category: '일반' },
  { value: '💬', label: '상담', category: '일반' },
  { value: '📸', label: '사진', category: '일반' },
  { value: '🏷️', label: '태그', category: '일반' },
  { value: '📍', label: '위치', category: '일반' },
  { value: '🕐', label: '시간', category: '일반' },
  { value: '💰', label: '가격', category: '일반' },
  { value: '🎯', label: '타겟', category: '일반' },
]

/** 아이콘 카테고리 목록 */
export const ICON_CATEGORIES = [...new Set(BEAUTY_ICONS.map((i) => i.category))]

/** 카테고리별 아이콘 필터 */
export function getIconsByCategory(category: string): IconOption[] {
  return BEAUTY_ICONS.filter((i) => i.category === category)
}

/** 아이콘 검색 */
export function searchIcons(query: string): IconOption[] {
  const q = query.toLowerCase()
  return BEAUTY_ICONS.filter(
    (i) => i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
  )
}

// ==================== 아이콘 배경색 프리셋 ====================

export const ICON_BG_COLORS = [
  { value: '#EFF6FF', label: '연파랑' },
  { value: '#FEF3C7', label: '연노랑' },
  { value: '#ECFDF5', label: '연초록' },
  { value: '#FFF1F2', label: '연분홍' },
  { value: '#F5F3FF', label: '연보라' },
  { value: '#FFF7ED', label: '연주황' },
  { value: '#F0FDF4', label: '연민트' },
  { value: '#FDF4FF', label: '연마젠타' },
  { value: '#FEFCE8', label: '연레몬' },
  { value: '#F0F9FF', label: '연하늘' },
] as const

// ==================== 뷰티 카테고리 기본 프리셋 ====================

export interface CategoryPreset {
  icon: string
  iconBgColor: string
  label: string
  href: string
}

/** 뷰티 카테고리 기본 프리셋 (시드 데이터용) */
export const BEAUTY_CATEGORY_PRESETS: CategoryPreset[] = [
  { icon: '👁️', iconBgColor: '#EFF6FF', label: '쌍꺼풀', href: '/categories/eye' },
  { icon: '👃', iconBgColor: '#FFF1F2', label: '코성형', href: '/categories/nose' },
  { icon: '💉', iconBgColor: '#F5F3FF', label: '필러/보톡스', href: '/categories/filler' },
  { icon: '✨', iconBgColor: '#ECFDF5', label: '피부관리', href: '/categories/skin' },
  { icon: '💆', iconBgColor: '#FEF3C7', label: '리프팅', href: '/categories/lifting' },
  { icon: '🦷', iconBgColor: '#FFF7ED', label: '치아교정', href: '/categories/dental' },
  { icon: '💪', iconBgColor: '#F0FDF4', label: '바디', href: '/categories/body' },
  { icon: '💄', iconBgColor: '#FDF4FF', label: '반영구', href: '/categories/permanent' },
]

// ==================== 신뢰 통계 기본 프리셋 ====================

export interface TrustStatPreset {
  icon: string
  iconBgColor: string
  label: string
  value: string
}

export const TRUST_STAT_PRESETS: TrustStatPreset[] = [
  { icon: '⭐', iconBgColor: '#FEF3C7', label: '만족도', value: '4.9/5.0' },
  { icon: '📝', iconBgColor: '#EFF6FF', label: '리뷰 수', value: '12,847건' },
  { icon: '🏥', iconBgColor: '#ECFDF5', label: '제휴 병원', value: '320곳' },
  { icon: '👤', iconBgColor: '#F5F3FF', label: '누적 회원', value: '58,000+' },
]
