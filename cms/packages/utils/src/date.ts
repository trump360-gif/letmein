import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatDate(date: string | Date) {
  return format(new Date(date), 'yyyy-MM-dd')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'yyyy-MM-dd HH:mm')
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko })
}
