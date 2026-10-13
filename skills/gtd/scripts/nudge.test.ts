import { expect, test } from 'bun:test'
import type { Task } from './mindwtr'
import { summarize } from './nudge'

const OLD = '2026-10-01T03:00:00Z'
const TODAY = '2026-10-13T03:00:00Z'
const task = (over: Partial<Task> & Pick<Task, 'title' | 'status'>): Task => ({
  id: over.title,
  createdAt: OLD,
  updatedAt: OLD,
  ...over,
})

test('마감 지남·오늘 마감·지난 집중·묵은 받은 일함을 한 줄로', () => {
  const tasks = [
    task({ title: '지난 마감', status: 'next', dueDate: '2026-10-12' }),
    task({ title: '오늘 마감', status: 'waiting', dueDate: '2026-10-13T17:00:00+09:00' }),
    task({ title: '어제 집중', status: 'next', isFocusedToday: true }),
    task({ title: '받은 일', status: 'inbox' }),
    task({ title: '끝난 일', status: 'done', dueDate: '2026-10-01' }),
    task({ title: '지운 일', status: 'next', dueDate: '2026-10-01', deletedAt: OLD }),
  ]
  expect(summarize(tasks, '2026-10-13')).toBe(
    'GTD · 마감 지남: 지난 마감 · 오늘 마감: 오늘 마감 · 지난 집중 1건 · 받은 일함 1건(10-01부터) → /gtd',
  )
})

test('오늘 받은 일과 오늘 고른 집중만 있으면 띄우지 않음', () => {
  const tasks = [
    task({ title: '오늘 받은 일', status: 'inbox', createdAt: TODAY, updatedAt: TODAY }),
    task({ title: '오늘 집중', status: 'next', isFocusedToday: true, updatedAt: TODAY }),
  ]
  expect(summarize(tasks, '2026-10-13')).toBeNull()
})
