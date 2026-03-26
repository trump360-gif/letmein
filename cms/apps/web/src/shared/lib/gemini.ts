import { GoogleGenerativeAI } from '@google/generative-ai'

let client: GoogleGenerativeAI | null = null

function getClient() {
  if (!client) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
    client = new GoogleGenerativeAI(key)
  }
  return client
}

async function generate(prompt: string): Promise<string> {
  const model = getClient().getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function evaluatePostScores(title: string, content: string): Promise<{
  seoScore: number
  aeoScore: number
  geoScore: number
  feedback: string
}> {
  const prompt = `
다음 블로그 포스트의 SEO, AEO, GEO 점수를 0-100으로 평가해주세요.

제목: ${title}
본문 (앞부분): ${content.slice(0, 800)}

평가 기준:
- SEO (0-100): 키워드 밀도, 메타태그 적합성, 구조화 데이터 가능성, 가독성
- AEO (0-100): 질문-답변 구조, Featured Snippet 가능성, 직접적 답변 포함
- GEO (0-100): 인용 가능성, 사실 기반 정보, 신뢰성 지표, 통계/수치 포함

JSON 형식으로 응답:
{
  "seoScore": 숫자,
  "aeoScore": 숫자,
  "geoScore": 숫자,
  "feedback": "개선 방향 한 문장"
}
`
  try {
    const text = await generate(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { seoScore: 50, aeoScore: 50, geoScore: 50, feedback: '평가 실패' }
    return JSON.parse(jsonMatch[0])
  } catch {
    return { seoScore: 50, aeoScore: 50, geoScore: 50, feedback: '평가 실패' }
  }
}
