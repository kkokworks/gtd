# nod

[nod](https://github.com/kkokworks/nod) 에 일을 맡깁니다. 맡긴 작업이 끝나면 Mindwtr 항목이 저절로 닫힙니다.

## 설치

- nod 는 nod 의 README 대로 설치합니다.
- Claude: 알림을 연결합니다. `ln -sf <스킬 폴더>/sources/nod/notify.ts ~/.nod/notify`
- 확인: `nod ls` 가 동작하고 `~/.nod/notify` 가 이 파일을 가리키면 됩니다.
- 선택: 내일 준비([tomorrow.md](../../tomorrow.md))를 평일 18시에 사람 없이 돌리려면 사용자가 트리거를 등록합니다. 등록할 때 `--source` 명령을 한 번 실행하는데, Claude 의 샌드박스 안에서는 캘린더를 읽지 못하므로 `!` 로 실행합니다. macos-calendar 를 켰다면 일정을 샌드박스 밖에서 읽어 지시에 붙여 넘깁니다.
  ```sh
  ! nod trigger add '0 18 * * MON-FRI' 'gtd 스킬의 내일 준비(~/.claude/skills/gtd/tomorrow.md)를 사람 없이 하세요. 사용자에게 묻지 말고, 끝나면 작업 보고만 남기세요.' --source 'd=$(date -v+1d +%F); [ "$(date +%u)" = 5 ] && d=$(date -v+3d +%F); printf "%s\t%s\n" "$d" "$(sh "$HOME/.claude/skills/gtd/sources/macos-calendar/calendar-events.sh" "$d" | tr "\n" " ")"'
  ```
  macos-calendar 를 켜지 않았다면 `--source` 부분을 빼고 등록합니다.

## 맡기기

프로젝트 하나를 통째로 맡아 굴릴 때는 [root.md](root.md) 를 따릅니다.

사용자가 nod 에 맡기기로 확인한 항목은 nod 스킬의 "일 맡기기" 절차대로 `nod add` 합니다. 지시에는 무엇을, 어디서, 무엇이 되면 끝인지를 씁니다. 결정 알림은 nod 스킬대로 전합니다.

nod 에 일을 맡길 때는 Mindwtr 에서 출발했든 아니든 반드시 연결 표시를 남깁니다. 그래야 알림(`notify.ts`)이 끝난 일을 스스로 닫습니다.
- Mindwtr 항목을 대기로 바꿉니다. 상태 `waiting`, `assignedTo` 는 `nod`, 상황은 `@nod`, 설명 첫 줄은 `nod #<작업 번호>` 입니다. 맞는 항목이 없으면 새로 만듭니다.
- 이렇게 해 두면 알림이 알아서 처리합니다. 작업이 성공하면 결과 한 줄을 붙여 완료하고, `nod drop` 하면 취소합니다.
- 결정은 따로 항목을 만들지 않고 그 작업의 항목에 모읍니다. 결정이 열리면 항목을 `next` 로 올리고 체크리스트에 "결정 #N"을 더하며, 질문은 설명 끝에 둡니다. 답하면 체크하고 다시 `waiting` 으로 돌립니다.
- 연결 표시를 빠뜨려도 결정이 열리는 순간 알림이 `<이슈> nod #N: <작업 요약>` 항목을 만듭니다. 이슈는 `nod add --issue` 로 준 키입니다. 이슈에 딸린 일이면 맡길 때 `--issue <이슈 키>` 를 줍니다.

## 끝남

- 설명 첫 줄이 `nod #N` 인 항목은 `nod ls` 로 확인합니다. 성공했으면 완료하고, 결정이 열려 있으면 전합니다. Mindwtr 가 꺼져 있던 때에 끝난 작업은 알림이 닫지 못했을 수 있습니다.
