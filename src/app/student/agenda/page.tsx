import StudentAgendaView from "@/components/student/student-agenda-view";
import { nowIso, todayWibKey } from "@/lib/calendar";

export default function StudentAgendaPage() {
  const todayKey = todayWibKey();
  const now = Date.parse(nowIso());

  return <StudentAgendaView todayKey={todayKey} now={now} />;
}
