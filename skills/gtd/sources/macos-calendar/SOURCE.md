# macOS 캘린더

macOS 캘린더 앱에 붙은 캘린더를 EventKit 으로 읽습니다. 구글·iCloud·Exchange 캘린더도 캘린더 앱에 계정을 붙이면 함께 읽힙니다.

## 설치

- Claude: `sh <스킬 폴더>/sources/macos-calendar/build.sh` (Xcode Command Line Tools 필요)
- 사용자: `! sh <스킬 폴더>/sources/macos-calendar/calendar-events.sh <오늘 날짜>` 를 한 번 실행해 캘린더 권한을 허용합니다. 다시 빌드하면 권한을 다시 물을 수 있습니다.
- 확인: 같은 명령이 일정을 JSON 줄로 출력하면 됩니다.

## 다가오는 것

`sh <스킬 폴더>/sources/macos-calendar/calendar-events.sh <YYYY-MM-DD> [일수]` 가 일정 하나를 JSON 한 줄로 출력합니다. 칸은 `start`·`end`·`allDay`·`title`·`calendar` 이고, 있으면 `location`·`url`·`notes`·`attendees`·`myStatus` 가 붙습니다.

- Claude 의 Bash 샌드박스 안에서는 실패하거나(오류 -10825), 오류 없이 빈 결과가 나올 수 있습니다. 실패했거나 결과가 비었으면 일정이 없다고 단정하지 말고, 사용자에게 같은 명령을 `!` 로 실행해 달라고 해 대화에 들어온 출력을 씁니다.
- `myStatus` 가 `pending` 이면 아직 답하지 않은 초대입니다. "초대에 답하기"를 후보로 둡니다.
- 자료를 읽거나 안건을 정해야 하는 회의는 "회의 준비"를 후보로 둡니다. 시작일은 회의 날, 제목에 회의 이름을 넣습니다.
