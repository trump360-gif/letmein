export interface MediaItem {
  id: string
  userId: string | null
  folderId: string | null
  originalName: string
  fileType: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  altText: string | null
  createdAt: string
  deletedAt: string | null
  thumbUrl: string
  fullUrl: string
}

export interface MediaFolderItem {
  id: string
  userId: string | null
  parentId: string | null
  name: string
  createdAt: string
  mediaCount: number
  children: MediaFolderItem[]
}

export interface MediaUploadResponse {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  thumbUrl: string
  fullUrl: string
}

export type MediaFileType = 'image' | 'video' | 'document' | 'other'

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']
export const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip']

export const MAX_UPLOAD_SIZE_MB = 20
export const THUMB_WIDTH = 300
export const THUMB_HEIGHT = 300
