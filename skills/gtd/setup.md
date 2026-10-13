# 처음 설정

`mindwtr_*` 도구가 없거나 연결이 안 될 때, 또는 사용자가 설치나 방식 변경을 원할 때 이 순서로 안내합니다. 토큰은 대화에 붙이게 하지 않습니다. 키체인에 쓰는 단계는 사용자가 `!` 로 직접 실행합니다.

1. Mindwtr 방식을 고릅니다.
   - 데스크톱 앱: `brew install --cask mindwtr`. 앱의 Settings → Integrations → MCP 를 켜고 **Allow changes** 를 켠 뒤 **Copy connection details** 를 누릅니다. 업무 데이터를 넣는다면 **Opt out of diagnostics** 도 켭니다. 앱이 켜져 있어야 동작합니다.
   - Docker: Docker 가 켜져 있으면 됩니다. 동기화 서버·웹 화면·MCP 가 이 PC 안에서만 열리고, 데이터는 `~/.local/share/gtd` 에 둡니다. 지운 항목 되살리기는 안 됩니다.
2. 사용자에게 `! bun <레포>/skills/gtd/scripts/setup.ts <desktop|docker>` 실행을 부탁합니다. 스킬 링크, 개인 설정 뼈대, 토큰, Claude Code MCP 등록, 세션 시작 알림 훅을 한 번에 합니다. 여러 번 실행해도 되고, 방식을 바꿀 때도 다시 실행합니다.
3. Docker 방식이면 웹 화면(http://localhost:5173)의 Settings → Sync → Self-Hosted 에 `http://localhost:8787` 과 동기화 토큰을 넣게 안내합니다. 토큰은 `! security find-generic-password -s mindwtr-cloud -w | pbcopy` 로 복사해 붙입니다.
4. Claude Code 를 다시 시작해 `mindwtr_*` 도구가 보이면 됩니다.
5. 업무 도구를 켭니다([sources/README.md](sources/README.md)).
6. 주간 리뷰용 반복 항목을 만들지 묻습니다([review.md](review.md)).
