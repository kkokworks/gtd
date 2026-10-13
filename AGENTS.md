# gtd — 에이전트 안내

이 문서는 목차입니다. 본문은 아래 파일에 있습니다. 작업을 시작하기 전에 규칙을 모두 읽고 따릅니다.

## 규칙

| 규칙 | 한 줄 |
|---|---|
| [public-repo](.claude/rules/public-repo.md) | 공개 레포입니다. 회사 내용·개인정보·민감정보·개인 업무 맥락을 코드·문서·커밋 메시지에 넣지 않고, 커밋 전에 확인합니다 |

Claude Code 는 `.claude/rules/` 를 자동으로 읽습니다. 다른 에이전트는 위 파일을 직접 읽습니다.

## 스킬

| 스킬 | 쓰는 때 |
|---|---|
| [gtd](skills/gtd/SKILL.md) | Mindwtr 로 GTD 를 할 때. `~/.claude/skills/gtd` 에 링크해 `/gtd` 로 씁니다 |

업무 도구는 [skills/gtd/sources/](skills/gtd/sources/) 에 하나씩 있습니다. 새 도구를 더할 때는 [sources/README.md](skills/gtd/sources/README.md) 의 약속을 따릅니다.

## 문서

| 문서 | 내용 |
|---|---|
| [README.md](README.md) | 설치와 사용법 |

## 검증

커밋 전에 `bun test`, `bun run typecheck`, `bun run lint` 가 모두 통과해야 합니다.

> 규칙·스킬을 더하면 이 표에도 한 줄을 더합니다.
