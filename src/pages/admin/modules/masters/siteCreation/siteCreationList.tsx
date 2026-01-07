import { Link } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { getEncryptedRoute } from "@/utils/routeCache";

export default function SiteCreationList() {
  const { encMasters, encSiteCreation } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encMasters}/${encSiteCreation}/new`;

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Master / Site Creation List
        </h1>
        <p className="text-sm text-gray-500">
          View configured sites and key commercial details.
        </p>
      </div>
      <Link to={ENC_NEW_PATH} className="p-button p-button-success p-button-sm">
        + Create
      </Link>
    </div>
  );

  return (
    <div className="p-3">
      <DataTable
        value={[]}
        header={header}
        emptyMessage="No sites available."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="Site Name" field="site_name" />
        <Column header="State" field="state" />
        <Column header="District" field="district" />
        <Column header="ULB" field="ulb" />
        <Column header="Status" field="status" />
        <Column header="Project Value" field="project_value" />
        <Column header="Project Type" field="project_type_details" />
        <Column header="Weighbridge Count" field="weighbridge_count" />
      </DataTable>
    </div>
  );
}
