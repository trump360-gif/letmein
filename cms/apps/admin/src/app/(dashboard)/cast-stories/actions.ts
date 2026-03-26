'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

export async function blindStory(storyId: number) {
  await prisma.castStory.update({
    where: { id: BigInt(storyId) },
    data: { status: 'blinded' },
  })
  revalidatePath('/cast-stories')
}

export async function restoreStory(storyId: number) {
  await prisma.castStory.update({
    where: { id: BigInt(storyId) },
    data: { status: 'active' },
  })
  revalidatePath('/cast-stories')
}

export async function deleteStory(storyId: number) {
  await prisma.castStory.update({
    where: { id: BigInt(storyId) },
    data: { status: 'deleted' },
  })
  revalidatePath('/cast-stories')
}
