#!/bin/sh
# 캘린더 일정을 읽습니다. 권한이 CalendarEvents.app 에 붙도록 앱으로 실행하고 출력만 넘겨받습니다.
# 사용: calendar-events.sh <YYYY-MM-DD> [일수]
set -eu
dir=$(cd "$(dirname "$0")" && pwd)
out=$(mktemp); err=$(mktemp)
trap 'rm -f "$out" "$err"' EXIT
open -W -n -g --stdout "$out" --stderr "$err" -a "$dir/CalendarEvents.app" --args "$@"
if [ -s "$err" ]; then cat "$err" >&2; exit 1; fi
cat "$out"
