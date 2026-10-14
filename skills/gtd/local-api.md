# 데스크톱 로컬 API

데스크톱 앱 방식의 `mindwtr_update_task` 에는 `attachments` 칸이 없습니다. 이미 있는 항목의 첨부 링크를 바꿀 때는 앱의 로컬 API 를 씁니다.

## 켜기 (한 번)

1. 사용자에게 앱의 Settings → Advanced → **Local API server** 를 켜게 합니다. 기본 포트는 3456 이고 이 PC(127.0.0.1)에서만 열립니다. 포트를 바꿨으면 아래 주소의 3456 을 그 포트로 씁니다.
2. 같은 카드의 토큰을 복사한 뒤 아래 한 줄을 사용자가 실행하게 합니다. 토큰은 키체인 `mindwtr-local-api` 에만 남고, 클립보드는 비웁니다.
   ```
   ! printf 'add-generic-password -U -s mindwtr-local-api -a "%s" -w "%s"\n' "$USER" "$(pbpaste)" | security -i && pbcopy </dev/null
   ```
3. 확인: 아래가 `200` 을 출력하면 됩니다.
   ```sh
   T=$(security find-generic-password -s mindwtr-local-api -a "$USER" -w)
   curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $T" 'http://127.0.0.1:3456/tasks?limit=1'
   ```

## 첨부 링크 바꾸기

1. `mindwtr_get_task` 로 그 항목의 지금 첨부 목록을 받습니다.
2. 바꿀 링크의 `uri`(필요하면 `title`)만 고친 목록을 만듭니다. 각 첨부의 `id`·`kind`·`createdAt` 과 다른 첨부는 받은 그대로 둡니다.
3. 그 목록 **전체**를 보냅니다. 토큰은 실행할 때 키체인에서 읽고 화면에 출력하지 않습니다.
   ```sh
   T=$(security find-generic-password -s mindwtr-local-api -a "$USER" -w)
   curl -fsS -X PATCH -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
     "http://127.0.0.1:3456/tasks/<항목 id>" -d '{"attachments":[<고친 첨부 전체>]}'
   ```
   끝난(`done`) 항목도 상태와 완료 시각은 그대로 둔 채 첨부만 바뀝니다.
4. `mindwtr_get_task` 로 다시 읽어 첨부의 `id`·`uri` 가 보낸 것과 같은지 봅니다.

끝: 바꾼 항목마다 다시 읽은 첨부가 보낸 목록과 같습니다.
