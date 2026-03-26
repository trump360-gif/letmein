interface HtmlBlockSectionProps {
  html: string
}

export function HtmlBlockSection({ html }: HtmlBlockSectionProps) {
  if (!html) return null

  // script, iframe, on* 이벤트 핸들러 제거
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </section>
  )
}
