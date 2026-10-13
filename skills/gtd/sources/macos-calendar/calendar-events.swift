// /gtd 가 macOS 캘린더 일정을 읽을 때 쓰는 명령입니다. 처음 실행할 때 캘린더 접근 권한을 묻습니다.
// 사용: calendar-events.sh <YYYY-MM-DD> [일수] (CalendarEvents.app 으로 감싸 실행합니다)
// 출력: 일정 하나에 JSON 한 줄. myStatus 가 pending 이면 아직 초대에 답하지 않은 일정입니다.
// 빌드: sh build.sh
import EventKit
import Foundation

func fail(_ message: String, _ code: Int32) -> Never {
  FileHandle.standardError.write(Data((message + "\n").utf8))
  exit(code)
}

let args = CommandLine.arguments
let day = DateFormatter()
day.dateFormat = "yyyy-MM-dd"
day.timeZone = .current
guard args.count == 2 || args.count == 3, let from = day.date(from: args[1]) else {
  fail("사용: calendar-events <YYYY-MM-DD> [일수]", 64)
}
guard let days = args.count == 3 ? Int(args[2]) : 1, days > 0 else { fail("일수는 1 이상의 정수입니다", 64) }

let store = EKEventStore()
if EKEventStore.authorizationStatus(for: .event) != .fullAccess {
  guard (try? await store.requestFullAccessToEvents()) == true else {
    fail("캘린더 접근 권한이 없습니다. 시스템 설정 → 개인정보 보호 및 보안 → 캘린더에서 이 터미널 앱을 허용해 주세요.", 77)
  }
}

guard let to = Calendar.current.date(byAdding: .day, value: days, to: from) else { fail("날짜 계산 실패", 70) }
let events = store.events(matching: store.predicateForEvents(withStart: from, end: to, calendars: nil))
  .sorted { $0.startDate < $1.startDate }
let time = ISO8601DateFormatter()
time.timeZone = .current

func status(_ value: EKParticipantStatus) -> String {
  switch value {
  case .accepted: "accepted"
  case .declined: "declined"
  case .tentative: "tentative"
  case .pending: "pending"
  default: "other"
  }
}

for event in events {
  var row: [String: Any] = [
    "start": time.string(from: event.startDate),
    "end": time.string(from: event.endDate),
    "allDay": event.isAllDay,
    "title": event.title ?? "",
    "calendar": event.calendar.title,
  ]
  if let value = event.location, !value.isEmpty { row["location"] = value }
  if let value = event.url { row["url"] = value.absoluteString }
  if let value = event.notes, !value.isEmpty { row["notes"] = String(value.prefix(500)) }
  if let attendees = event.attendees, !attendees.isEmpty {
    row["attendees"] = attendees.count
    if let me = attendees.first(where: { $0.isCurrentUser }) { row["myStatus"] = status(me.participantStatus) }
  }
  let data = try JSONSerialization.data(withJSONObject: row, options: [.sortedKeys])
  print(String(decoding: data, as: UTF8.self))
}
