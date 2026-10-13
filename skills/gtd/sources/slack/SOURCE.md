# Slack

Slack MCP 서버의 도구로 읽습니다.

## 설치

- 필요한 것: `saved_list`·`saved_update`·`conversations_unreads`·`conversations_search_messages` 도구를 주는 Slack MCP 서버. 이 PC 에 로컬로 설치해 Claude Code 에 등록합니다.
- 사용자: Slack 토큰은 MCP 서버 설정에 직접 넣습니다. 대화에 붙이지 않습니다.
- 확인: 이 세션의 도구 목록에 `conversations_unreads` 가 있으면 됩니다.

## 모으기

1. "나중에" 저장(`saved_list`): 사용자가 직접 저장한 것이라 모두 후보입니다.
2. 안 읽은 멘션과 DM(`conversations_unreads`): 사용자에게 무언가를 해 달라는 요청만 후보로 둡니다. 공유·인사·답이 필요 없는 말은 뺍니다.
3. 넣은 뒤: "나중에" 항목을 Mindwtr 에 넣었으면 Slack 에서 완료로 바꿀지 묻습니다(`saved_update`). 사용자가 원할 때만 바꿉니다.

## 끝남

- 항목이 생긴 뒤 사용자가 그 스레드에 답했으면 회신 항목은 끝난 것입니다.
- 상대가 확인·완료를 알렸으면("값이 일치합니다", "폐기했습니다") 그 일을 기다리던 항목도 끝난 것입니다.
- 항목에 스레드 링크가 없으면 설명의 PR·이슈 번호나 상대 이름으로 `conversations_search_messages` 를 해 찾습니다.
- 일부만 답했을 수 있으므로, 사람 없이 돌 때는 이 근거만으로 완료하지 않고 남겨 둡니다.

## 다가오는 것

- "나중에" 저장 중 기한이 그 기간 안인 것.
