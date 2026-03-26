import { api } from '@/shared/api/client'

// ==================== Types ====================

export interface DashboardStats {
  totalUsers: number
  totalPosts: number
  todayNewUsers: number
  todayNewPosts: number
  pendingReports: number
  changes: {
    newUsers: number
    newPosts: number
  }
  aiStats: {
    todaySuccess: number
    todayFailed: number
  }
  updatedAt: string
}

export interface DailyChartItem {
  date: string
  newUsers: number
  newPosts: number
  newComments: number
  newReports: number
  activeUsers: number
}

export interface BoardActivityItem {
  boardId: string
  name: string
  postCount: number
}

export interface DashboardChartData {
  daily: DailyChartItem[]
  boardActivity: BoardActivityItem[]
  aiDaily: Array<{ date: string; success: number; failed: number }>
}

export interface TodoItem {
  id: string
  label: string
  count: number
  href: string
  urgency: 'high' | 'medium' | 'low'
}

export interface DashboardTodoData {
  items: TodoItem[]
}

// ==================== API Functions ====================

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api
    .get('admin/dashboard/stats')
    .json<{ success: boolean; data: DashboardStats }>()
  return res.data
}

export async function fetchDashboardChart(days: number = 7): Promise<DashboardChartData> {
  const res = await api
    .get('admin/dashboard/chart', { searchParams: { days: days.toString() } })
    .json<{ success: boolean; data: DashboardChartData }>()
  return res.data
}

export async function fetchDashboardTodo(): Promise<DashboardTodoData> {
  const res = await api
    .get('admin/dashboard/todo')
    .json<{ success: boolean; data: DashboardTodoData }>()
  return res.data
}
