# Plane

이슈 트래커입니다. 나에게 배정된 열린 이슈마다 Mindwtr 에 다음 행동이 하나 있고, 그 항목은 이슈가 속한 프로젝트(업무 묶음)에 둡니다(SKILL.md 의 원칙). Plane API 를 `plane.ts` 로 읽고 씁니다.

## 설치

- 사용자: Plane 의 프로필 → API tokens 에서 토큰을 만들어 복사하고 아래 한 줄을 실행합니다. 토큰은 키체인 `plane-api` 에만 남고, 클립보드는 비웁니다.
  ```
  ! printf 'add-generic-password -U -s plane-api -a "%s" -w "%s"\n' "$USER" "$(pbpaste)" | security -i && pbcopy </dev/null
  ```
- config.json 에 넣을 값:
  ```json
  "plane": { "url": "<Plane 주소>", "workspace": "<워크스페이스 slug>", "projects": ["<프로젝트 식별자>"] }
  ```
  `projects` 는 훑을 프로젝트의 식별자입니다(이슈 키 `ENG-12` 의 `ENG`).
- 확인: `bun <스킬 폴더>/sources/plane/plane.ts` 가 오류 없이 출력하면 됩니다.

## 모으기

`bun <스킬 폴더>/sources/plane/plane.ts` 를 실행합니다. 나에게 배정된 열린 항목이 키·제목·상태·마감·주소로 나옵니다.
- 항목마다 Mindwtr 에 다음 행동이 있는지 키로 찾습니다. 없으면 이슈를 읽고 다음 행동 하나와 넣을 프로젝트를 제안합니다.
- 이슈 내용은 옮기지 않고 출력의 주소만 답니다.

## 끝남

- `plane.ts get <키>...` 의 상태 묶음이 `completed` 나 `cancelled` 면 끝난 것입니다.
- 같은 일의 PR 이 있으면 PR 상태를 믿습니다. 이슈 상태는 늦게 따라옵니다.

## 다가오는 것

- 모으기 출력에서 마감이 그 기간 안인 항목.

## 댓글

`plane.ts comment <키>` 에 글을 표준 입력으로 넘기면 그 이슈에 댓글로 남습니다. 빈 줄로 문단을 나눕니다.
