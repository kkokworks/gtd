// Forgejo(또는 Gitea)의 진행 상황을 읽습니다(읽기 전용, tea 로그인 사용).
// 사용: bun <스킬 폴더>/sources/forgejo/forgejo.ts
// 출력: 나를 직접 리뷰어로 지정한 PR, 내가 연 열린 PR, 내가 맡은 레포의 기본 브랜치 CI·열린 PR.
// 설정(config.json 의 forgejo): org 는 훑을 조직, maintainerFile·maintainerKey 는 "내가 맡은 레포" 판정용
// (레포 안 그 파일에 `<maintainerKey>: <내 아이디>` 줄이 있으면 내가 맡은 레포). 둘이 없으면 그 칸은 건너뜁니다.
import { loadConfig } from '../../scripts/config'

// 쓰는 칸만 적은 Forgejo API 응답 모양입니다.
type User = { login: string }
type Pr = {
  number: number
  title: string
  html_url: string
  updated_at: string
  user: User
  repository?: { full_name: string }
  requested_reviewers?: User[] | null
}
type Repo = { name: string; archived: boolean; default_branch: string; open_issues_count: number }

const forgejo = (await loadConfig()).forgejo
if (!forgejo) {
  throw new Error(
    'config.json 에 forgejo.org 가 없습니다. sources/forgejo/SOURCE.md 의 설치를 따라 주세요.',
  )
}

function api<T>(path: string): T {
  const result = Bun.spawnSync(['tea', 'api', path])
  if (result.exitCode !== 0) {
    throw new Error(`tea api ${path} 실패: ${result.stderr.toString().trim()}`)
  }
  return JSON.parse(result.stdout.toString())
}
const day = (iso: string | undefined) => iso?.slice(0, 10) ?? '-'
const repoOf = (pr: Pr) => pr.repository?.full_name ?? '?'

const me = api<User>('user').login
// review_requested 는 팀 지정까지 잡으므로, 나를 직접 지정한 PR 만 남깁니다.
const reviewMe = api<Pr[]>(
  'repos/issues/search?type=pulls&state=open&review_requested=true&page=1&limit=50',
).filter((pr) =>
  (api<Pr>(`repos/${repoOf(pr)}/pulls/${pr.number}`).requested_reviewers ?? []).some(
    (u) => u.login === me,
  ),
)
console.log(`## 나를 직접 리뷰어로 지정한 PR ${reviewMe.length}`)
for (const pr of reviewMe) {
  console.log(
    `- ${repoOf(pr)}#${pr.number} ${pr.title} (by ${pr.user.login}, ${day(pr.updated_at)}) ${pr.html_url}`,
  )
}
const myPrs = api<Pr[]>('repos/issues/search?type=pulls&state=open&created=true&page=1&limit=50')
console.log(`## 내가 연 열린 PR ${myPrs.length}`)
for (const pr of myPrs) {
  console.log(`- ${repoOf(pr)}#${pr.number} ${pr.title} (${day(pr.updated_at)}) ${pr.html_url}`)
}

const { org, maintainerFile, maintainerKey } = forgejo
if (maintainerFile && maintainerKey) {
  console.log('## 내가 맡은 레포')
  const owner = new RegExp(`^${maintainerKey}:\\s*(\\S+)`, 'm')
  for (const repo of api<Repo[]>(`orgs/${org}/repos?page=1&limit=100`).filter((r) => !r.archived)) {
    const raw = Bun.spawnSync(['tea', 'api', `repos/${org}/${repo.name}/raw/${maintainerFile}`])
    const maintainer = owner.exec(raw.stdout.toString())?.[1]?.replace(/["']/g, '')
    if (maintainer?.split('@')[0] !== me) continue
    const branch = repo.default_branch
    const status = api<{ state: string }>(`repos/${org}/${repo.name}/commits/${branch}/status`)
    const prs = api<Pr[]>(`repos/${org}/${repo.name}/pulls?state=open&page=1&limit=50`)
    console.log(
      `### ${repo.name} — ${branch} CI ${status.state || '없음'}, 열린 이슈 ${repo.open_issues_count}, 열린 PR ${prs.length}`,
    )
    for (const pr of prs) {
      const reviewers = (pr.requested_reviewers ?? []).map((u) => u.login).join(',')
      console.log(
        `- #${pr.number} ${pr.title} (by ${pr.user.login}, ${day(pr.updated_at)}${reviewers ? `, 리뷰 요청 ${reviewers}` : ''})`,
      )
    }
  }
}
