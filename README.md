# gtd

[Mindwtr](https://github.com/dongdongbh/Mindwtr) 를 기록 시스템으로 삼아 Claude Code 세션에서 GTD 를 하는 스킬입니다. 할 일을 받아 적고, 업무 도구에서 할 일을 모으고, 받은 일함을 비우고, 오늘 집중할 일을 고르고, 주간 리뷰를 합니다. Claude 는 비서 역할을 하고, 무엇을 할지는 사람이 정합니다.

업무 도구(Slack·Linear·GitHub·Forgejo·캘린더·nod)는 플러그인처럼 켜고 끕니다. 코어는 도구 이름을 모르고, 켠 도구의 설명서(`SOURCE.md`)만 따릅니다. 안 쓰게 된 도구는 설정에서 한 줄 지우면 됩니다.

## 구성

```
skills/gtd/
├─ SKILL.md          받아 적기·첫 화면·원칙 (/gtd 를 부르면 읽힘)
├─ scan.md           업무 도구 훑기, 끝난 일 정리
├─ clarify.md        받은 일함 비우기
├─ focus.md          오늘 집중 고르기
├─ tomorrow.md       내일 준비
├─ review.md         주간 리뷰
├─ setup.md          처음 설정
├─ scripts/          설치(setup.ts), 세션 시작 알림(nudge.ts), Mindwtr 연결
└─ sources/          업무 도구 하나에 폴더 하나 (sources/README.md)
compose.yaml         Docker 방식으로 Mindwtr 를 띄울 때
```

## 설치

macOS, [Bun](https://bun.sh), Claude Code CLI 가 필요합니다. 토큰은 macOS 키체인에 둡니다.

Mindwtr 는 두 방식 중 하나로 씁니다. 나중에 `setup.ts` 를 다른 방식으로 다시 실행하면 바뀝니다.

| | 데스크톱 앱 | Docker |
|---|---|---|
| 설치 | `brew install --cask mindwtr` | Docker 만 있으면 됨 |
| 화면 | 데스크톱 앱 | 브라우저 화면(http://localhost:5173) |
| Claude 가 붙는 MCP | 앱 내장 `127.0.0.1:8722` | `mindwtr-mcp` `127.0.0.1:8723` |
| 켜져 있어야 하는 것 | 앱 | Docker |
| 데이터 | 앱이 관리 | `~/.local/share/gtd` |
| 지운 항목 되살리기 | 됨 | 안 됨 |

### 데스크톱 앱

1. `brew install --cask mindwtr`
2. 앱의 Settings → Integrations → MCP 를 켜고, **Allow changes** 를 켠 뒤 **Copy connection details** 를 누릅니다.
3. 설치합니다.
   ```sh
   git clone https://github.com/kkokworks/gtd && cd gtd
   bun skills/gtd/scripts/setup.ts desktop
   ```

### Docker

```sh
git clone https://github.com/kkokworks/gtd && cd gtd
bun skills/gtd/scripts/setup.ts docker
```

토큰을 새로 만들어 키체인에 넣고 동기화 서버·웹 화면·MCP 를 띄웁니다. 웹 화면의 Settings → Sync → Self-Hosted 에 `http://localhost:8787` 과 동기화 토큰(`security find-generic-password -s mindwtr-cloud -w | pbcopy` 로 복사)을 넣으면 됩니다. 데스크톱·모바일 앱도 같은 주소와 토큰으로 동기화할 수 있습니다.

### setup.ts 가 하는 일

- `~/.claude/skills/gtd` 를 이 레포의 `skills/gtd` 로 링크합니다. Claude Code 에서 `/gtd` 로 부릅니다.
- 개인 설정 `~/.config/gtd/config.json` 의 뼈대를 만듭니다.
- Mindwtr 토큰을 키체인에 넣고, Claude Code 에 `mindwtr` MCP 를 등록합니다.
- 하루 첫 세션에 놓친 일을 한 줄로 보여 주는 SessionStart 훅을 등록합니다.

여러 번 실행해도 됩니다. 끝나면 Claude Code 를 다시 시작합니다.

## 업무 도구 켜고 끄기

Claude 세션에서 "/gtd github 켜 줘"처럼 말하면, Claude 가 그 도구의 `SOURCE.md` 대로 설치하고 사용자가 칠 한 줄(로그인·권한 허용)을 알려 줍니다. 끄려면 "/gtd github 꺼 줘"라고 하거나 설정에서 이름을 지웁니다. 새 도구를 만드는 법은 [sources/README.md](skills/gtd/sources/README.md) 에 있습니다.

## 개인 설정

레포 밖에 둡니다. 회사·팀에 관한 값은 여기에만 씁니다.

`~/.config/gtd/config.json`
```json
{
  "sources": ["slack", "linear", "github", "macos-calendar", "nod"],
  "mindwtr": { "mcpUrl": "http://127.0.0.1:8722/mcp" },
  "forgejo": { "org": "<조직>", "maintainerFile": "project.yaml", "maintainerKey": "maintainer" }
}
```

`~/.config/gtd/profile.md` (선택): 사용자의 역할, 지켜보는 일(직접 하지 않지만 진행을 봐야 하는 팀의 일), 자주 쓰는 말을 적습니다. 스킬이 시작할 때 함께 읽습니다.

## 개발

```sh
bun install
bun test && bun run typecheck && bun run lint
```

공개 레포입니다. 커밋 전에 [.claude/rules/public-repo.md](.claude/rules/public-repo.md) 를 확인합니다.
