import { Boxes } from "lucide-react";
import ProjectRegisterList from "./ProjectRegisterList";

export default function SiteInventoryDocList() {
  return (
    <ProjectRegisterList
      type="site-inventory"
      title="Site Inventory"
      icon={Boxes}
      viewTo={(r) => `/inventory/site-inventory/all?project_id=${r.id}`}
      editTo={(r) => `/inventory/site-inventory/transactions/new?project_id=${r.id}`}
      createTo="/inventory/site-inventory/transactions/new"
      createLabel="New entry"
    />
  );
}
