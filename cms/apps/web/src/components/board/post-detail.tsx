import Link from 'next/link'
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Eye,
  Heart,
  CornerDownRight,
  LogIn,
} from 'lucide-react'
import { LikeButton } from './like-button'
import { ShareButton } from './share-button'

interface Comment {
  id: string
  content: string
  authorName: string
  createdAt: string
  parentId: string | null
  likeCount: number
}

interface PostData {
  id: string
  title: string
  content: string
  authorName: string
  createdAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  comments: Comment[]
}

interface BoardData {
  nameKey: string
  slug: string
  useComment: boolean
  useLike: boolean
  useShare: boolean
}

interface PostNav {
  id: string
  title: string
}

interface PostDetailProps {
  post: PostData
  board: BoardData
  prevPost: PostNav | null
  nextPost: PostNav | null
  isLoggedIn?: boolean
  currentUser?: { nickname: string } | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const AVATAR_PALETTES = [
  { bg: '#FFF0F0', text: '#C62828' },
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#FFFDE7', text: '#F57F17' },
  { bg: '#F1F8E9', text: '#33691E' },
  { bg: '#E8F5E9', text: '#1B5E20' },
  { bg: '#E0F7FA', text: '#006064' },
  { bg: '#E3F2FD', text: '#0D47A1' },
  { bg: '#EDE7F6', text: '#4527A0' },
  { bg: '#FCE4EC', text: '#880E4F' },
]

function getAvatarStyle(name: string) {
  const code = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length]
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const style = getAvatarStyle(name)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

export function PostDetail({ post, board, prevPost, nextPost, isLoggedIn, currentUser }: PostDetailProps) {
  const rootComments = post.comments.filter((c) => !c.parentId)
  const replyMap = post.comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c]
    }
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-[800px] px-0 pb-12 sm:px-4 sm:pb-16">

      {/* ── 뒤로가기 ── */}
      <div className="px-4 py-4 sm:px-0 sm:py-5">
        <Link
          href={`/${board.slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#9E9D9B] transition-colors hover:text-[#3D8A5A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {board.nameKey} 목록으로
        </Link>
      </div>

      {/* ── 게시글 본문 ── */}
      <article className="bg-white sm:rounded-2xl sm:shadow-sm">

        {/* 헤더 */}
        <div className="border-b border-[#F0EFEC] px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
          <h1 className="text-[20px] font-bold leading-[1.45] tracking-[-0.025em] text-[#111] sm:text-[23px]">
            {post.title}
          </h1>

          {/* 작성자 + 메타 한 줄 */}
          <div className="mt-3.5 flex items-center gap-2.5">
            <Avatar name={post.authorName} size={30} />
            <span className="text-[13.5px] font-semibold text-[#333]">{post.authorName}</span>
            <span className="text-[#D8D7D5]">·</span>
            <span className="text-[12.5px] text-[#9E9D9B]">{formatDate(post.createdAt)}</span>
            <span className="ml-auto flex items-center gap-3 text-[12px] text-[#B8B7B5]">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.viewCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.commentCount}
              </span>
            </span>
          </div>
        </div>

        {/* 본문 */}
        <div
          className="post-content px-5 py-8 sm:px-8 sm:py-10"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* 액션 */}
        <div className="flex items-center justify-center gap-3 border-t border-[#F0EFEC] px-5 py-5 sm:px-8">
          <LikeButton postId={post.id} initialCount={post.likeCount} enabled={board.useLike} />
          {board.useShare && <ShareButton title={post.title} />}
        </div>
      </article>

      {/* ── 댓글 섹션 ── */}
      {board.useComment && (
        <div className="mt-3 bg-white sm:mt-4 sm:rounded-2xl sm:shadow-sm">

          {/* 댓글 헤더 */}
          <div className="flex items-center gap-2 border-b border-[#F0EFEC] px-5 py-4 sm:px-8">
            <MessageSquare className="h-4 w-4 text-[#3D8A5A]" />
            <span className="text-[14px] font-bold text-[#111]">댓글</span>
            <span className="text-[13px] font-semibold text-[#3D8A5A]">{post.commentCount}</span>
          </div>

          {/* 댓글 목록 */}
          {rootComments.length > 0 ? (
            <div>
              {rootComments.map((comment, i) => (
                <div key={comment.id}>
                  {/* 루트 댓글 */}
                  <div
                    className={`px-5 py-4 sm:px-8 ${
                      i < rootComments.length - 1 || replyMap[comment.id]
                        ? 'border-b border-[#F7F6F4]'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar name={comment.authorName} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-[#111]">
                            {comment.authorName}
                          </span>
                          <span className="text-[11.5px] text-[#B8B7B5]">
                            {formatDateShort(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[14px] leading-[1.75] text-[#3D3C3A]">
                          {comment.content}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <button className="flex items-center gap-1 text-[12px] text-[#B8B7B5] transition-colors hover:text-[#E57373]">
                            <Heart className="h-3 w-3" />
                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                          </button>
                          {isLoggedIn && (
                            <button className="text-[12px] text-[#B8B7B5] transition-colors hover:text-[#3D8A5A]">
                              답글
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 대댓글 */}
                  {replyMap[comment.id]?.map((reply, ri) => (
                    <div
                      key={reply.id}
                      className={`bg-[#FAFAF8] px-5 py-3.5 sm:px-8 ${
                        ri < (replyMap[comment.id]?.length ?? 0) - 1
                          ? 'border-b border-[#F2F1EF]'
                          : 'border-b border-[#F0EFEC]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 pl-2">
                        <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#CCC]" />
                        <Avatar name={reply.authorName} size={28} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#111]">
                              {reply.authorName}
                            </span>
                            <span className="text-[11px] text-[#B8B7B5]">
                              {formatDateShort(reply.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-[13.5px] leading-[1.7] text-[#3D3C3A]">
                            {reply.content}
                          </p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <button className="flex items-center gap-1 text-[11.5px] text-[#B8B7B5] transition-colors hover:text-[#E57373]">
                              <Heart className="h-2.5 w-2.5" />
                              {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare className="h-7 w-7 text-[#DDD]" />
              <p className="text-[13px] text-[#B0AFAD]">첫 번째 댓글을 남겨보세요.</p>
            </div>
          )}

          {/* 댓글 입력 */}
          <div className="border-t border-[#F0EFEC] px-5 py-4 sm:px-8">
            {isLoggedIn ? (
              <div className="flex gap-2.5">
                <Avatar name={currentUser?.nickname || '나'} size={32} />
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="댓글을 입력하세요"
                    className="flex-1 rounded-xl border border-[#E8E7E4] bg-[#FAFAF8] px-4 py-2 text-[13.5px] placeholder:text-[#C5C4C2] focus:border-[#3D8A5A] focus:bg-white focus:outline-none transition-colors"
                  />
                  <button className="shrink-0 rounded-xl bg-[#3D8A5A] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#336B49]">
                    등록
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E8E7E4] bg-[#FAFAF8] py-3.5 text-[13.5px] text-[#9E9D9B] transition-colors hover:border-[#3D8A5A] hover:text-[#3D8A5A]"
              >
                <LogIn className="h-4 w-4" />
                로그인 후 댓글을 작성할 수 있습니다
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── 이전/다음 글 ── */}
      {(prevPost || nextPost) && (
        <nav className="mt-3 overflow-hidden bg-white sm:mt-4 sm:rounded-2xl sm:shadow-sm">
          {prevPost && (
            <Link
              href={`/${board.slug}/${prevPost.id}`}
              className="flex items-center gap-3 border-b border-[#F0EFEC] px-5 py-3.5 text-sm transition-colors hover:bg-[#FAFAF8] sm:px-8"
            >
              <ChevronUp className="h-4 w-4 shrink-0 text-[#C8C7C5]" />
              <span className="shrink-0 text-[11.5px] font-medium text-[#B0AFAD]">이전글</span>
              <span className="truncate text-[13.5px] text-[#3D3C3A]">{prevPost.title}</span>
            </Link>
          )}
          {nextPost && (
            <Link
              href={`/${board.slug}/${nextPost.id}`}
              className="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-[#FAFAF8] sm:px-8"
            >
              <ChevronDown className="h-4 w-4 shrink-0 text-[#C8C7C5]" />
              <span className="shrink-0 text-[11.5px] font-medium text-[#B0AFAD]">다음글</span>
              <span className="truncate text-[13.5px] text-[#3D3C3A]">{nextPost.title}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
