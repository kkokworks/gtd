// 하루 첫 Claude Code 세션에서 놓치면 안 되는 GTD 상태를 한 줄로 띄웁니다(SessionStart 훅).
// systemMessage 라 사용자 화면에만 뜨고 대화 문맥에는 들어가지 않습니다.
// 띄울 것이 없거나 Mindwtr 가 꺼져 있으면 아무것도 출력하지 않습니다.
import { connect, type Task } from './mindwtr'

const STAMP = `${import.meta.dir}/.nudged`
const MAX_TITLES = 3
const TITLE_CHARS = 24

// 날짜만 온 값("2026-10-12")은 그대로, 시각이 붙은 값은 이 PC 의 날짜로 바꿉니다.
export const localDay = (iso: string) =>
  iso.length === 10 ? iso : new Date(iso).toLocaleDateString('sv-SE')

export function summarize(tasks: Task[], today: string): string | null {
  const open = tasks.filter((t) => !t.deletedAt && ['inbox', 'next', 'waiting'].includes(t.status))
  const titles = (ts: Task[]) =>
    ts.length <= MAX_TITLES
      ? ts.map((t) => t.title.slice(0, TITLE_CHARS)).join(', ')
      : `${ts.length}건`
  const overdue = open.filter((t) => t.dueDate && localDay(t.dueDate) < today)
  const dueToday = open.filter((t) => t.dueDate && localDay(t.dueDate) === today)
  // ponytail: 집중을 표시한 날이 따로 없어 updatedAt 으로 짐작합니다. 오늘 다른 칸을 고친 지난 집중은 놓칩니다.
  const staleFocus = open.filter((t) => t.isFocusedToday && localDay(t.updatedAt) < today)
  const inbox = open.filter((t) => t.status === 'inbox')
  const oldestInbox = inbox.map((t) => localDay(t.createdAt)).sort()[0]
  const parts = [
    overdue.length > 0 && `마감 지남: ${titles(overdue)}`,
    dueToday.length > 0 && `오늘 마감: ${titles(dueToday)}`,
    staleFocus.length > 0 && `지난 집중 ${staleFocus.length}건`,
    oldestInbox !== undefined &&
      oldestInbox < today &&
      `받은 일함 ${inbox.length}건(${oldestInbox.slice(5)}부터)`,
  ].filter(Boolean)
  return parts.length > 0 ? `GTD · ${parts.join(' · ')} → /gtd` : null
}

if (import.meta.main) {
  const today = localDay(new Date().toISOString())
  // nod 워커 세션은 사람이 보지 않으니 하루치 알림을 쓰지 않습니다.
  if (process.env.NOD_HOME) process.exit(0)
  const stamp = Bun.file(STAMP)
  if ((await stamp.exists()) && (await stamp.text()) === today) process.exit(0)

  let tasks: Task[]
  try {
    const tool = await connect('gtd-nudge')
    tasks = (await tool<{ tasks: Task[] }>('mindwtr_list_tasks', { status: 'all', limit: 1000 }))
      .tasks
  } catch (error) {
    // Mindwtr 가 꺼져 있는 것은 정상 상태라 조용히 넘어가고, 다음 세션에서 다시 봅니다.
    if (error instanceof Error && 'code' in error && error.code === 'ConnectionRefused')
      process.exit(0)
    console.log(
      JSON.stringify({ systemMessage: `GTD 알림: Mindwtr 를 읽지 못했습니다 (${error})` }),
    )
    process.exit(0)
  }
  await Bun.write(STAMP, today)
  const line = summarize(tasks, today)
  if (line) console.log(JSON.stringify({ systemMessage: line }))
}
