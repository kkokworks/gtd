// 개인 설정(~/.config/gtd/config.json)을 읽습니다. 켠 업무 도구와 도구별 값이 들어 있고, 레포 밖에 둡니다.
export const CONFIG_DIR = `${process.env.HOME}/.config/gtd`
export const CONFIG_PATH = `${CONFIG_DIR}/config.json`

export type Config = {
  // 켠 업무 도구. skills/gtd/sources/<이름> 의 이름입니다.
  sources: string[]
  mindwtr: { mcpUrl: string }
  forgejo?: { org: string; maintainerFile?: string; maintainerKey?: string }
  // projects 는 훑을 프로젝트 식별자입니다(이슈 키 ENG-12 의 ENG).
  plane?: { url: string; workspace: string; projects: string[] }
}

export async function loadConfig(): Promise<Config> {
  const file = Bun.file(CONFIG_PATH)
  if (!(await file.exists())) {
    throw new Error(`${CONFIG_PATH} 가 없습니다. skills/gtd/setup.md 대로 설치해 주세요.`)
  }
  const config = await file.json()
  if (!Array.isArray(config.sources) || typeof config.mindwtr?.mcpUrl !== 'string') {
    throw new Error(`${CONFIG_PATH} 에 sources 배열과 mindwtr.mcpUrl 이 있어야 합니다.`)
  }
  return config
}
