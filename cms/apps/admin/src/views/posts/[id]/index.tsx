'use client'

import { useRouter } from 'next/navigation'
import { Button, Input } from '@letmein/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  User,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Search as SearchIcon,
  Globe,
  Pencil,
  Save,
  X,
  ImagePlus,
  Loader2,
  Send,
  FileX,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState, useEffect } from 'react'
import { usePostDetail, useBlindPost, useDeletePost, useUpdatePost, useGeneratePostThumbnail } from '@/features/post-manage/queries'
import { POST_STATUS } from '@/shared/lib/constants'
import { format } from 'date-fns'

const TipTapEditor = dynamic(
  () => import('@/widgets/editor').then((mod) => mod.TipTapEditor),
  { ssr: false, loading: () => <div className="flex h-[400px] items-center justify-center"><p className="text-sm text-muted-foreground">에디터 로딩 중...</p></div> },
)

interface PostDetailPageProps {
  postId: string
}

export function PostDetailPage({ postId }: PostDetailPageProps) {
  const router = useRouter()
  const { data, isLoading } = usePostDetail(postId)
  const blindMutation = useBlindPost()
  const deleteMutation = useDeletePost()
  const updateMutation = useUpdatePost(postId)
  const thumbnailMutation = useGeneratePostThumbnail(postId)

  const post = data?.success ? data.data : null

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editMetaTitle, setEditMetaTitle] = useState('')
  const [editMetaDesc, setEditMetaDesc] = useState('')
  const [editSummary, setEditSummary] = useState('')

  useEffect(() => {
    if (post && !editing) {
      setEditTitle(post.title)
      setEditContent(post.content)
      setEditMetaTitle(post.metaTitle ?? '')
      setEditMetaDesc(post.metaDesc ?? '')
      setEditSummary(post.summary ?? '')
    }
  }, [post, editing])

  const contentHtml = useMemo(() => {
    if (!post?.content) return ''
    const isHtml = /^<[a-zA-Z]/.test(post.content.trim())
    if (isHtml) return post.content
    // lazy import marked only when needed
    const { marked } = require('marked')
    return marked.parse(post.content, { async: false }) as string
  }, [post?.content])

  const handlePublish = async () => {
    if (!post) return
    const action = post.status === 'published' ? '비공개(draft)' : '발행'
    if (!confirm(`이 게시물을 ${action}하시겠습니까?`)) return
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published'
      await updateMutation.mutateAsync({ status: newStatus })
    } catch (err) {
      alert(`상태 변경 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  const handleBlind = async () => {
    if (!confirm('블라인드 상태를 변경하시겠습니까?')) return
    await blindMutation.mutateAsync(postId)
  }

  const handleDelete = async () => {
    if (!confirm('이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await deleteMutation.mutateAsync(postId)
      router.push('/contents/posts')
    } catch (err) {
      alert(`삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        title: editTitle,
        content: editContent,
        metaTitle: editMetaTitle,
        metaDesc: editMetaDesc,
        summary: editSummary,
      })
      setEditing(false)
    } catch (err) {
      alert(`저장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  const handleGenerateThumbnail = async () => {
    try {
      await thumbnailMutation.mutateAsync()
    } catch (err) {
      alert(`썸네일 생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">게시물을 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/contents/posts')}>
          목록으로
        </Button>
      </div>
    )
  }

  const statusLabel = POST_STATUS[post.status as keyof typeof POST_STATUS] ?? post.status

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="sm" onClick={() => router.push('/contents/posts')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            목록
          </Button>
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-base font-bold flex-1"
            />
          ) : (
            <h2 className="text-xl font-bold truncate">{post.title}</h2>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                저장
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-1.5 h-4 w-4" />
                취소
              </Button>
            </>
          ) : (
            <>
              {post.status !== 'published' ? (
                <Button size="sm" onClick={handlePublish} disabled={updateMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-4 w-4" />
                  )}
                  발행
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handlePublish} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <FileX className="mr-1.5 h-4 w-4" />
                  )}
                  비공개
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                편집
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBlind}
                disabled={blindMutation.isPending}
              >
                {post.status === 'blind' ? (
                  <>
                    <Eye className="mr-1.5 h-4 w-4" />
                    블라인드 해제
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-1.5 h-4 w-4" />
                    블라인드
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            작성자
          </div>
          <p className="mt-1 font-medium">{post.userNickname ?? '(탈퇴)'}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            작성일
          </div>
          <p className="mt-1 font-medium">{format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            조회수 / 좋아요
          </div>
          <p className="mt-1 font-medium">
            {post.viewCount.toLocaleString()} / {post.likeCount}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            댓글 / 신고
          </div>
          <p className="mt-1 font-medium">
            {post.commentCount}{' '}
            {post.reportCount > 0 && (
              <span className="text-destructive">
                / <AlertTriangle className="inline h-3.5 w-3.5" /> {post.reportCount}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">내용</TabsTrigger>
          <TabsTrigger value="seo">
            <SearchIcon className="mr-1.5 h-3.5 w-3.5" />
            SEO/AO/GEO
          </TabsTrigger>
          <TabsTrigger value="revisions">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            수정 이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="rounded-lg border bg-card">
            {/* 메타 바 */}
            <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
              <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-medium">
                {post.boardName}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : post.status === 'blind'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {statusLabel}
              </span>
              {post.isNotice && (
                <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  공지
                </span>
              )}
              {post.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 썸네일 */}
            <div className="border-b px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">썸네일</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateThumbnail}
                  disabled={thumbnailMutation.isPending}
                >
                  {thumbnailMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {post.thumbnailId ? 'AI 이미지 재생성' : 'AI 이미지 생성'}
                </Button>
              </div>
              {post.thumbnailId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/v1/media/${post.thumbnailId}`}
                  alt={post.title}
                  className="h-40 w-auto rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  썸네일 없음 — AI 이미지 생성 버튼으로 자동 생성
                </div>
              )}
            </div>

            {/* 본문 */}
            {editing ? (
              <div className="p-4">
                <TipTapEditor
                  content={editContent}
                  onChange={setEditContent}
                  showSeoPanel
                  title={editTitle}
                />
              </div>
            ) : (
              <div
                className="prose prose-sm sm:prose max-w-none px-4 py-6"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="rounded-lg border bg-card p-6 space-y-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Globe className="h-5 w-5" />
              SEO / AO / GEO 설정
            </h3>

            {editing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Meta Title</label>
                  <Input
                    value={editMetaTitle}
                    onChange={(e) => setEditMetaTitle(e.target.value)}
                    placeholder="검색엔진 제목 (비워두면 포스트 제목 사용)"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Meta Description</label>
                  <Input
                    value={editMetaDesc}
                    onChange={(e) => setEditMetaDesc(e.target.value)}
                    placeholder="검색엔진 설명 (150자 이내)"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">AI 요약 (AO)</label>
                  <Input
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder="2-3문장 요약"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2 pt-2">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Meta Title</label>
                  <p className="mt-1 rounded border bg-muted/30 px-3 py-2 text-sm">
                    {post.metaTitle || <span className="text-muted-foreground italic">미설정</span>}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Schema Type</label>
                  <p className="mt-1 rounded border bg-muted/30 px-3 py-2 text-sm">
                    {post.schemaType || <span className="text-muted-foreground italic">미설정</span>}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                  <p className="mt-1 rounded border bg-muted/30 px-3 py-2 text-sm">
                    {post.metaDesc || <span className="text-muted-foreground italic">미설정</span>}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">AI 요약 (AO)</label>
                  <p className="mt-1 rounded border bg-muted/30 px-3 py-2 text-sm">
                    {post.summary || <span className="text-muted-foreground italic">미설정</span>}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">OG 이미지 ID</label>
                  <p className="mt-1 rounded border bg-muted/30 px-3 py-2 text-sm">
                    {post.ogImageId || <span className="text-muted-foreground italic">미설정</span>}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">noIndex</label>
                  <p className="mt-1 rounded border bg-muted/30 px-3 py-2 text-sm">
                    {post.noIndex ? '설정됨 (검색엔진 제외)' : '미설정'}
                  </p>
                </div>
                {post.faqData != null && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">FAQ 구조화 데이터 (GEO)</label>
                    <pre className="mt-1 max-h-48 overflow-auto rounded border bg-muted/30 px-3 py-2 text-xs">
                      {JSON.stringify(post.faqData, null, 2)}
                    </pre>
                  </div>
                )}
                {(post.seoScore !== null || post.aeoScore !== null || post.geoScore !== null) && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">AI 생성 점수</label>
                    <div className="mt-2 flex items-center gap-6">
                      {[
                        { label: 'SEO', score: post.seoScore },
                        { label: 'AEO', score: post.aeoScore },
                        { label: 'GEO', score: post.geoScore },
                      ].map(({ label, score }) =>
                        score !== null ? (
                          <div key={label} className="text-center">
                            <div
                              className={`text-2xl font-bold ${
                                score >= 70
                                  ? 'text-green-600'
                                  : score >= 50
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {score}
                            </div>
                            <div className="text-xs text-muted-foreground">{label}</div>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="revisions">
          <div className="rounded-lg border bg-card">
            {post.revisions.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                수정 이력이 없습니다.
              </div>
            ) : (
              <div className="divide-y">
                {post.revisions.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{rev.title}</p>
                      <p className="text-sm text-muted-foreground">
                        수정 ID: {rev.id}
                        {rev.userId && ` | 수정자: ${rev.userId}`}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(rev.createdAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
