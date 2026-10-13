#!/bin/sh
# CalendarEvents.app 을 빌드합니다. 캘린더 권한이 이 앱에 붙도록 앱 번들로 만들고 ad-hoc 서명합니다.
# Xcode Command Line Tools(swiftc)가 필요합니다. 다시 빌드하면 macOS 가 캘린더 권한을 다시 물을 수 있습니다.
set -eu
dir=$(cd "$(dirname "$0")" && pwd)
app="$dir/CalendarEvents.app"
rm -rf "$app"
mkdir -p "$app/Contents/MacOS"
cp "$dir/Info.plist" "$app/Contents/Info.plist"
swiftc -O -swift-version 5 "$dir/calendar-events.swift" -o "$app/Contents/MacOS/calendar-events"
codesign -s - --force "$app"
echo "빌드했습니다: $app"
