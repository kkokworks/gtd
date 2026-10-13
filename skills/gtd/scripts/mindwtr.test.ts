import { expect, test } from 'bun:test'
import { mentionsIssue, type Task } from './mindwtr'

const task = (title: string, description?: string): Task => ({
  id: 't',
  title,
  status: 'next',
  createdAt: '',
  updatedAt: '',
  description,
})

test('mentionsIssue finds the key in the title or description, not inside a longer key', () => {
  const eng12 = mentionsIssue('ENG-12')
  expect(eng12(task('ENG-12 리뷰 코멘트 반영하기'))).toBe(true)
  expect(eng12(task('리뷰하기', 'Linear: https://linear.app/x/issue/ENG-12'))).toBe(true)
  expect(eng12(task('ENG-12를 닫기'))).toBe(true)
  expect(eng12(task('ENG-123 리뷰하기'))).toBe(false)
  expect(eng12(task('XENG-12 리뷰하기'))).toBe(false)
  expect(eng12(task('ENG-12-a 리뷰하기'))).toBe(false)
  expect(mentionsIssue('a.b')(task('axb 하기'))).toBe(false)
  const linked = {
    ...task('체크리스트 진행하기'),
    attachments: [{ uri: 'https://linear.app/x/issue/ENG-12' }],
  }
  expect(eng12(linked)).toBe(true)
})
