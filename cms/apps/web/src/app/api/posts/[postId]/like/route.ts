import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const id = BigInt(postId)

  const post = await prisma.post.update({
    where: { id },
    data: { likeCount: { increment: 1 } },
    select: { likeCount: true },
  }).catch(() => null)

  if (!post) {
    return NextResponse.json({ success: false }, { status: 404 })
  }

  return NextResponse.json({ success: true, likeCount: post.likeCount })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params
  const id = BigInt(postId)

  const current = await prisma.post.findUnique({ where: { id }, select: { likeCount: true } }).catch(() => null)
  if (!current) return NextResponse.json({ success: false }, { status: 404 })

  const post = await prisma.post.update({
    where: { id },
    data: { likeCount: { decrement: current.likeCount > 0 ? 1 : 0 } },
    select: { likeCount: true },
  }).catch(() => null)

  if (!post) return NextResponse.json({ success: false }, { status: 404 })

  return NextResponse.json({ success: true, likeCount: post.likeCount })
}
