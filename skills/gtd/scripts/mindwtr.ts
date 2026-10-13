// Mindwtr MCP(HTTP)에 붙는 작은 클라이언트입니다. 데스크톱 앱 내장 MCP 와 Docker 의 mindwtr-mcp 는
// 같은 방식이라 주소(config.json 의 mindwtr.mcpUrl)만 다릅니다. 토큰은 키체인에서 읽습니다.
import { loadConfig } from './config'

const HEADERS_HELPER = `${import.meta.dir}/mcp-headers.sh`
const TIMEOUT_MS = 5000

export type Check = { id: string; title: string; isCompleted: boolean }
export type Task = {
  id: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
  description?: string
  projectId?: string
  attachments?: { title?: string; uri: string }[]
  deletedAt?: string
  dueDate?: string
  isFocusedToday?: boolean
  checklist?: Check[]
}
// 결과의 모양은 도구마다 다르므로 부르는 쪽이 T 로 적습니다(예: tool<{ tasks: Task[] }>('mindwtr_list_tasks', …)).
export type Tool = <T = unknown>(name: string, args: unknown) => Promise<T>
// 제목·설명·링크가 이슈 키를 언급하는가. ENG-12 가 ENG-123 이나 XENG-12 에 걸리지 않게 앞뒤를 끊어 봅니다.
export function mentionsIssue(issue: string): (t: Task) => boolean {
  const escaped = issue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const key = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`)
  return (t) =>
    key.test(
      [t.title, t.description, ...(t.attachments ?? []).flatMap((a) => [a.title, a.uri])].join(
        '\n',
      ),
    )
}
type RpcResponse = {
  result?: { isError?: boolean; content: { text: string }[] }
  error?: unknown
}

export async function connect(clientName: string): Promise<Tool> {
  const { mcpUrl } = (await loadConfig()).mindwtr
  const helper = Bun.spawnSync(['sh', HEADERS_HELPER])
  if (helper.exitCode !== 0) throw new Error(`Mindwtr 토큰을 읽지 못했습니다: ${helper.stderr}`)
  const headers: Record<string, string> = {
    ...JSON.parse(helper.stdout.toString()),
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  let rpcId = 0
  async function rpc(method: string, params: unknown): Promise<RpcResponse> {
    const res = await fetch(mcpUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const sid = res.headers.get('mcp-session-id')
    if (sid) headers['Mcp-Session-Id'] = sid
    const text = await res.text()
    const body = text.startsWith('{')
      ? text
      : text
          .split('\n')
          .find((l) => l.startsWith('data:'))
          ?.slice(5)
    if (!body) throw new Error(`Mindwtr MCP 응답 없음 (${res.status}) ${method}`)
    return JSON.parse(body)
  }
  await rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: clientName, version: '1' },
  })
  return async <T>(name: string, args: unknown): Promise<T> => {
    const { result, error } = await rpc('tools/call', { name, arguments: args })
    const text = result?.content[0]?.text
    if (error || result?.isError || text === undefined) {
      throw new Error(`${name}: ${JSON.stringify(error ?? result?.content)}`)
    }
    return JSON.parse(text)
  }
}
