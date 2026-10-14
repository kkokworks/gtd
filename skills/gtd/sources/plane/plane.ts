// Plane 의 이슈(작업 항목)를 읽고 댓글을 남깁니다. 토큰은 키체인 plane-api 에서 읽습니다.
// 사용: bun <스킬 폴더>/sources/plane/plane.ts              나에게 배정된 열린 항목
//       bun <스킬 폴더>/sources/plane/plane.ts get <키>...   항목의 상태
//       bun <스킬 폴더>/sources/plane/plane.ts comment <키>  표준 입력의 글을 댓글로
// 설정(config.json 의 plane): url, workspace, projects(훑을 프로젝트 식별자).
import { loadConfig } from '../../scripts/config'

// 쓰는 칸만 적은 Plane API(v1) 응답 모양입니다.
type Project = { id: string; identifier: string }
type State = { id: string; name: string; group: string }
type Item = {
  id: string
  name: string
  sequence_id: number
  project: string
  state: string
  assignees: string[]
  target_date: string | null
}
type Page<T> = T[] | { results: T[]; next_page_results?: boolean; next_cursor?: string }

const DONE = new Set(['completed', 'cancelled'])
const MAX_TRIES = 5

// 빈 줄로 나눈 문단을 <p> 로, 줄바꿈을 <br> 로 바꿉니다. Plane 댓글은 HTML 로 받습니다.
export const toHtml = (text: string) =>
  text
    .trim()
    .split(/\n\s*\n/)
    .map(
      (p) =>
        `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`,
    )
    .join('')

async function connect() {
  const plane = (await loadConfig()).plane
  if (!plane) {
    throw new Error(
      'config.json 에 plane 이 없습니다. sources/plane/SOURCE.md 의 설치를 따라 주세요.',
    )
  }
  const token = Bun.spawnSync([
    'security',
    'find-generic-password',
    '-s',
    'plane-api',
    '-a',
    `${process.env.USER}`,
    '-w',
  ])
  if (token.exitCode !== 0) {
    throw new Error(
      '키체인에 plane-api 토큰이 없습니다. sources/plane/SOURCE.md 의 설치를 따라 주세요.',
    )
  }
  const headers = {
    'X-API-Key': token.stdout.toString().trim(),
    'Content-Type': 'application/json',
  }
  const api = `${plane.url}/api/v1`
  const ws = `${api}/workspaces/${plane.workspace}`

  async function call<T>(url: string, body?: unknown): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.status === 429 && attempt < MAX_TRIES) {
        await Bun.sleep((Number(res.headers.get('retry-after')) || 2 ** attempt) * 1000)
        continue
      }
      const text = await res.text()
      if (!res.ok)
        throw new Error(`Plane ${url.slice(api.length)} → ${res.status} ${text.slice(0, 200)}`)
      return JSON.parse(text)
    }
  }
  async function all<T>(url: string): Promise<T[]> {
    const sep = url.includes('?') ? '&' : '?'
    let found: T[] = []
    let cursor = ''
    for (;;) {
      const page = await call<Page<T>>(`${url}${sep}per_page=100${cursor && `&cursor=${cursor}`}`)
      if (Array.isArray(page)) return page
      found = found.concat(page.results)
      if (!page.next_page_results || !page.next_cursor) return found
      cursor = page.next_cursor
    }
  }
  const stateCache = new Map<string, Map<string, State>>()
  async function states(projectId: string) {
    const cached = stateCache.get(projectId)
    if (cached) return cached
    const fetched = new Map(
      (await all<State>(`${ws}/projects/${projectId}/states/`)).map((s) => [s.id, s]),
    )
    stateCache.set(projectId, fetched)
    return fetched
  }
  const browse = (key: string) => `${plane.url}/${plane.workspace}/browse/${key}/`
  return { plane, api, ws, call, all, states, browse }
}

if (import.meta.main) {
  const [command = 'mine', ...keys] = Bun.argv.slice(2)
  const { plane, api, ws, call, all, states, browse } = await connect()

  if (command === 'mine') {
    const me = await call<{ id: string }>(`${api}/users/me/`)
    const projects = await all<Project>(`${ws}/projects/`)
    for (const identifier of plane.projects) {
      const project = projects.find((p) => p.identifier === identifier)
      if (!project)
        throw new Error(
          `Plane 에 프로젝트 ${identifier} 가 없습니다(config.json 의 plane.projects).`,
        )
      const projectStates = await states(project.id)
      // 서버의 담당자 필터로 받습니다. 이 필터를 모르는 Plane 은 값을 무시하므로 여기서 한 번 더 거릅니다.
      // 전부 받으면 항목 1만여 건(114페이지)에 2분 41초, 필터로는 2.5초였습니다.
      const url = `${ws}/projects/${project.id}/work-items/?assignees=${me.id}`
      const mine = (await all<Item>(url)).filter(
        (i) => i.assignees.includes(me.id) && !DONE.has(projectStates.get(i.state)?.group ?? ''),
      )
      console.log(`## ${identifier} 나에게 배정된 열린 항목 ${mine.length}`)
      for (const i of mine.sort((a, b) => a.sequence_id - b.sequence_id)) {
        const key = `${identifier}-${i.sequence_id}`
        const state = projectStates.get(i.state)?.name ?? '?'
        const due = i.target_date ? `, 마감 ${i.target_date}` : ''
        console.log(`- ${key} ${i.name} (${state}${due}) ${browse(key)}`)
      }
    }
  } else if (command === 'get') {
    for (const key of keys) {
      const item = await call<Item>(`${ws}/work-items/${key}/`)
      const state = (await states(item.project)).get(item.state)
      console.log(
        `- ${key} ${state?.group ?? '?'} ${state?.name ?? '?'} ${item.name} ${browse(key)}`,
      )
    }
  } else if (command === 'comment') {
    const [key] = keys
    const text = await Bun.stdin.text()
    if (!key || !text.trim()) throw new Error('사용: echo "<글>" | plane.ts comment <키>')
    const item = await call<Item>(`${ws}/work-items/${key}/`)
    await call(`${ws}/projects/${item.project}/work-items/${item.id}/comments/`, {
      comment_html: toHtml(text),
    })
    console.log(`댓글을 남겼습니다: ${browse(key)}`)
  } else {
    throw new Error(`모르는 명령 ${command} — mine, get <키>..., comment <키>`)
  }
}
