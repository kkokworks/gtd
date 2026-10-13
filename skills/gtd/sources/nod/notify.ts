#!/usr/bin/env bun
// nod 가 결정·답·성공·취소 때마다 부르는 알림 스크립트입니다(~/.nod/notify 로 링크). stdin 으로 이벤트 JSON 이 옵니다.
// Mindwtr 할 일을 nod 와 맞춥니다. nod 작업 하나 = Mindwtr 항목 하나(제목·설명에 "nod #<작업>").
// - 결정이 열리면 그 항목을 다음 행동으로 올리고 체크리스트에 결정을 더합니다. 항목이 없으면 만듭니다.
// - 답하면 그 결정을 체크하고 다시 nod 대기로 돌립니다.
// - 작업이 끝나면 그 항목을 완료(성공)하거나 취소(취소)합니다.
// Mindwtr 가 꺼져 있으면 실패로 끝나고, nod 는 stderr 에 남깁니다(장부에는 그대로 있음).
import { connect, type Task } from '../../scripts/mindwtr'

const REASON: Record<string, string> = {
  question: '질문',
  failed: '실패',
  check_failed: '검증 실패',
  permission: '권한',
  trust: '레포 신뢰',
  rule: '규칙 제안',
}

// 열린 결정의 질문은 설명 끝의 이 줄 아래에 둡니다. 답하면 이 줄부터 지웁니다.
const DECISION_MARK = '── 열린 nod 결정 ──'
const withoutDecision = (desc = '') => desc.split(`\n\n${DECISION_MARK}`)[0]
const decisionCheckId = (decisionId: number) => `nod-decision-${decisionId}`
const firstLine = (s: string, max: number) => (s.split('\n')[0] ?? '').slice(0, max)
// 연결 표시는 설명 첫머리의 "nod #<작업>" 뿐입니다. 본문에서 작업을 언급만 한 항목은 건드리지 않습니다.
const markedFor = (taskId: number) => (t: Task) =>
  new RegExp(`^nod #${taskId}(?!\\d)`).test(t.description ?? '')

const event = await Bun.stdin.json()
const tool = await connect('nod-notify')

async function openTasks(match: (t: Task) => boolean): Promise<Task[]> {
  const { tasks } = await tool<{ tasks: Task[] }>('mindwtr_list_tasks', {
    status: 'all',
    limit: 1000,
  })
  return tasks.filter(
    (t) => !t.deletedAt && t.status !== 'done' && t.status !== 'archived' && match(t),
  )
}

// 맡길 때 세션이 항목을 만들지 않았으면 여기서 만듭니다. 제목 앞의 이슈 번호로 같은 이슈끼리 모여 보입니다.
async function workTask(task: { id: number; brief: string; issue: string | null }): Promise<Task> {
  const found = (await openTasks(markedFor(task.id)))[0]
  if (found) return found
  await tool('mindwtr_add_task', {
    title: `${task.issue === null ? '' : `${task.issue} `}nod #${task.id}: ${firstLine(task.brief, 60)}`,
    status: 'waiting',
    assignedTo: 'nod',
    contexts: ['@nod'],
    description: `nod #${task.id}`,
  })
  const created = (await openTasks(markedFor(task.id)))[0]
  if (!created) throw new Error(`nod #${task.id} 항목을 만들었는데 다시 찾지 못했습니다`)
  return created
}

switch (event.event) {
  case 'decision': {
    const d = event.decision
    const t = await workTask(event.task)
    const summary = d.question.match(/^NOD: \w+ \| (.+)$/m)?.[1]
    await tool('mindwtr_update_task', {
      id: t.id,
      status: 'next',
      checklist: [
        ...(t.checklist ?? []),
        {
          id: decisionCheckId(d.id),
          title: `결정 #${d.id} ${REASON[d.reason] ?? d.reason}${summary ? `: ${summary.slice(0, 120)}` : ''}`,
          isCompleted: false,
        },
      ],
      description: `${withoutDecision(t.description)}\n\n${DECISION_MARK}\n답: \`nod ${d.id} <답>\`, 그만두기: \`nod drop ${d.id}\`\n\n${d.question.slice(-800)}`,
    })
    break
  }
  case 'answered': {
    const checkId = decisionCheckId(event.decision.id)
    for (const t of await openTasks(markedFor(event.task.id))) {
      await tool('mindwtr_update_task', {
        id: t.id,
        status: 'waiting',
        assignedTo: 'nod',
        checklist: (t.checklist ?? []).map((c) =>
          c.id === checkId ? { ...c, isCompleted: true } : c,
        ),
        description: withoutDecision(t.description),
      })
    }
    break
  }
  case 'succeeded': {
    for (const t of await openTasks(markedFor(event.task.id))) {
      await tool('mindwtr_update_task', {
        id: t.id,
        description: `${t.description ?? ''}\n\nnod 결과: ${event.summary}`.trim(),
      })
      await tool('mindwtr_complete_task', { id: t.id })
    }
    break
  }
  case 'cancelled': {
    for (const t of await openTasks(markedFor(event.task.id))) {
      await tool('mindwtr_update_task', { id: t.id, cancelledAt: new Date().toISOString() })
    }
    break
  }
  case 'error':
  case 'trigger_failed': {
    const what = event.task
      ? `nod 작업 #${event.task.id} 시작 실패`
      : `nod 트리거 #${event.trigger.id} 실패`
    await tool('mindwtr_add_task', {
      title: `${what} 확인하기`,
      status: 'inbox',
      description: `${event.error}`.slice(0, 1500),
    })
    break
  }
}
