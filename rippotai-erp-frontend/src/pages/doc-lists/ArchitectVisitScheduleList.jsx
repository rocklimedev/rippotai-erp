import { CalendarCheck } from "lucide-react";
import ProjectRegisterList from "./ProjectRegisterList";

export default function ArchitectVisitScheduleList() {
  return (
    <ProjectRegisterList
      type="architect-visit-schedule"
      title="Architect Site Visit Schedule"
      icon={CalendarCheck}
      viewTo={(r) => `/site-operations/visit-assignments?project=${r.id}&view=1`}
      editTo={(r) => `/site-operations/visit-assignments?project=${r.id}`}
      createTo="/site-operations/visit-assignments?new=1"
      createLabel="New schedule"
    />
  );
}
