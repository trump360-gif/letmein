import { z } from 'zod'
import {
  BANNER_POSITION_VALUES,
  BANNER_TYPE_VALUES,
  TARGET_AUDIENCE_VALUES,
  DISMISS_OPTION_VALUES,
} from '@letmein/types'

export const bannerSchema = z.object({
  name: z.string().min(1, '배너 이름을 입력하세요'),
  position: z.enum(BANNER_POSITION_VALUES),
  type: z.enum(BANNER_TYPE_VALUES),
  groupId: z.string().optional(),
  pcImageId: z.string().optional(),
  mobileImageId: z.string().optional(),
  tabletImageId: z.string().optional(),
  altText: z.string().optional(),
  textContent: z.string().optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  linkUrl: z.string().optional(),
  openNewTab: z.boolean(),
  utmCampaign: z.string().optional(),
  targetAudience: z.enum(TARGET_AUDIENCE_VALUES),
  minGrade: z.number().min(0).max(9),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  dismissOptions: z.array(z.enum(DISMISS_OPTION_VALUES)),
  abGroup: z.string().optional(),
  abRatio: z.number().min(0).max(100),
})

export type BannerFormValues = z.infer<typeof bannerSchema>

export const DEFAULT_VALUES: BannerFormValues = {
  name: '',
  position: 'main_top',
  type: 'image',
  groupId: '',
  pcImageId: '',
  mobileImageId: '',
  tabletImageId: '',
  altText: '',
  textContent: '',
  bgColor: '#ffffff',
  textColor: '#000000',
  linkUrl: '',
  openNewTab: false,
  utmCampaign: '',
  targetAudience: 'all',
  minGrade: 0,
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
  isActive: true,
  dismissOptions: ['today'],
  abGroup: '',
  abRatio: 50,
}

export const STEPS = [
  { id: 'basic', label: '기본 정보', description: '이름, 위치, 타입 설정' },
  { id: 'content', label: '콘텐츠', description: '이미지/HTML/텍스트 콘텐츠' },
  { id: 'link', label: '링크 & UTM', description: 'URL, UTM 파라미터' },
  { id: 'schedule', label: '기간 & 대상', description: '노출 기간, 대상 설정' },
  { id: 'abtest', label: 'A/B 테스트', description: 'A/B 테스트 설정' },
] as const
