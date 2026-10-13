// gtd 를 이 PC 에 설치합니다. 여러 번 실행해도 되고, 방식을 바꿀 때도 다시 실행합니다.
// 사용: bun skills/gtd/scripts/setup.ts <desktop|docker>
//   desktop: Mindwtr 데스크톱 앱 내장 MCP. 앱의 Settings → Integrations → MCP 에서 Allow changes 를 켜고
//            Copy connection details 를 누른 뒤 실행합니다(클립보드의 토큰을 키체인에 넣습니다).
//   docker:  레포의 compose.yaml 로 Mindwtr 서버·웹 화면·MCP 를 띄웁니다. 토큰은 새로 만들어 키체인에 둡니다.
// 하는 일: ~/.claude/skills/gtd 링크, ~/.config/gtd/config.json 뼈대, 토큰, Claude Code MCP 등록,
// 세션 시작 알림 훅 등록, (docker) 컨테이너 띄우기. 토큰은 화면에 출력하지 않습니다.
import { lstat, mkdir, readlink, realpath, symlink, unlink } from 'node:fs/promises'
import { CONFIG_DIR, CONFIG_PATH } from './config'

const MODES = {
  desktop: 'http://127.0.0.1:8722/mcp',
  docker: 'http://127.0.0.1:8723/mcp',
} as const
const arg = process.argv[2]
if (arg !== 'desktop' && arg !== 'docker') throw new Error('사용: bun setup.ts <desktop|docker>')
const mode: keyof typeof MODES = arg

const HOME = process.env.HOME
const USER = process.env.USER
if (!HOME || !USER) throw new Error('HOME·USER 환경 변수가 필요합니다.')
const SKILL_DIR = `${import.meta.dir}/..`
const REPO_DIR = `${SKILL_DIR}/../..`
const SKILL_LINK = `${HOME}/.claude/skills/gtd`
const SETTINGS = `${HOME}/.claude/settings.json`
const NUDGE_COMMAND = 'bun "$HOME/.claude/skills/gtd/scripts/nudge.ts"'
const DATA_DIR = process.env.GTD_DATA_DIR ?? `${HOME}/.local/share/gtd`

function run(cmd: string[], input?: string): string {
  const result = Bun.spawnSync(cmd, { stdin: input === undefined ? 'ignore' : Buffer.from(input) })
  if (result.exitCode !== 0)
    throw new Error(`${cmd[0]} ${cmd[1] ?? ''} 실패: ${result.stderr.toString().trim()}`)
  return result.stdout.toString()
}
const keychainHas = (service: string) =>
  Bun.spawnSync(['security', 'find-generic-password', '-s', service, '-a', USER]).exitCode === 0
const keychainGet = (service: string) =>
  run(['security', 'find-generic-password', '-s', service, '-a', USER, '-w']).trim()
// 토큰이 프로세스 목록에 보이지 않도록 security 의 대화형 입력으로 넘깁니다.
const keychainSet = (service: string, token: string) =>
  run(['security', '-i'], `add-generic-password -U -s ${service} -a "${USER}" -w "${token}"\n`)
const newToken = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')

async function linkSkill() {
  const real = await realpath(SKILL_DIR)
  const stat = await lstat(SKILL_LINK).catch(() => null)
  if (stat && !stat.isSymbolicLink()) {
    throw new Error(`${SKILL_LINK} 가 링크가 아닌 폴더입니다. 옮기거나 지운 뒤 다시 실행해 주세요.`)
  }
  if (stat && (await readlink(SKILL_LINK)) === real) return
  if (stat) await unlink(SKILL_LINK)
  await symlink(real, SKILL_LINK)
  console.log(`링크: ${SKILL_LINK} → ${real}`)
}

async function writeConfig() {
  await mkdir(CONFIG_DIR, { recursive: true })
  const file = Bun.file(CONFIG_PATH)
  const config = (await file.exists()) ? await file.json() : { sources: [] }
  await Bun.write(
    CONFIG_PATH,
    `${JSON.stringify({ ...config, mindwtr: { mcpUrl: MODES[mode] } }, null, 2)}\n`,
  )
  console.log(`설정: ${CONFIG_PATH} (mindwtr.mcpUrl = ${MODES[mode]})`)
}

function storeTokens() {
  if (mode === 'docker') {
    for (const service of ['mindwtr-mcp', 'mindwtr-cloud']) {
      if (!keychainHas(service)) keychainSet(service, newToken())
    }
    return
  }
  const auth = (() => {
    try {
      return JSON.parse(run(['pbpaste'])).mcpServers?.mindwtr?.headers?.Authorization
    } catch {
      return undefined
    }
  })()
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    keychainSet('mindwtr-mcp', auth.slice('Bearer '.length))
    run(['pbcopy'], '')
    console.log('토큰: 클립보드의 Mindwtr 토큰을 키체인(mindwtr-mcp)에 넣었습니다.')
    return
  }
  if (!keychainHas('mindwtr-mcp')) {
    throw new Error(
      '클립보드에 Mindwtr 연결 정보가 없습니다. 앱에서 Copy connection details 를 먼저 눌러 주세요.',
    )
  }
  console.log('토큰: 키체인(mindwtr-mcp)에 있는 토큰을 그대로 씁니다.')
}

function registerMcp() {
  Bun.spawnSync(['claude', 'mcp', 'remove', '-s', 'user', 'mindwtr'])
  const server = {
    type: 'http',
    url: MODES[mode],
    headersHelper: `${SKILL_LINK}/scripts/mcp-headers.sh`,
  }
  run(['claude', 'mcp', 'add-json', '-s', 'user', 'mindwtr', JSON.stringify(server)])
  console.log(`MCP: mindwtr → ${MODES[mode]}`)
}

type Hook = { type: string; command: string; timeout?: number }

async function registerHook() {
  const settings = await Bun.file(SETTINGS).json()
  settings.hooks = settings.hooks ?? {}
  settings.hooks.SessionStart = settings.hooks.SessionStart ?? []
  const sessionStart: { matcher?: string; hooks: Hook[] }[] = settings.hooks.SessionStart
  const existing = sessionStart
    .flatMap((m) => m.hooks)
    .find((h) => h.command.includes('gtd') && h.command.includes('nudge.ts'))
  if (existing?.command === NUDGE_COMMAND) return
  if (existing) existing.command = NUDGE_COMMAND
  else
    sessionStart.push({
      matcher: 'startup|clear|resume',
      hooks: [{ type: 'command', command: NUDGE_COMMAND, timeout: 10 }],
    })
  await Bun.write(SETTINGS, `${JSON.stringify(settings, null, 2)}\n`)
  console.log('훅: 세션 시작 알림(nudge.ts)을 등록했습니다.')
}

async function startDocker() {
  await mkdir(DATA_DIR, { recursive: true })
  const env = {
    ...process.env,
    GTD_DATA_DIR: DATA_DIR,
    MINDWTR_CLOUD_TOKEN: keychainGet('mindwtr-cloud'),
    MINDWTR_MCP_HTTP_TOKEN: keychainGet('mindwtr-mcp'),
  }
  const result = Bun.spawnSync(
    ['docker', 'compose', '-f', `${REPO_DIR}/compose.yaml`, 'up', '-d', '--pull', 'always'],
    { env, stdout: 'inherit', stderr: 'inherit' },
  )
  if (result.exitCode !== 0) throw new Error('docker compose up 실패')
  console.log(
    `Docker: 데이터 ${DATA_DIR}, 웹 화면 http://localhost:5173 — 화면의 Settings → Sync → Self-Hosted 에 http://localhost:8787 과 동기화 토큰을 넣습니다. 토큰 복사: security find-generic-password -s mindwtr-cloud -w | pbcopy`,
  )
}

await linkSkill()
await writeConfig()
storeTokens()
if (mode === 'docker') await startDocker()
registerMcp()
await registerHook()
console.log(
  '끝났습니다. Claude Code 를 다시 시작한 뒤 /gtd 로 업무 도구를 켜세요(sources/README.md).',
)
