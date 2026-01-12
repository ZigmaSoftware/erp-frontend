import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { districtApi, siteApi, stateApi } from "@/helpers/admin";
import { Switch } from "@/components/ui/switch";
import { getEncryptedRoute } from "@/utils/routeCache";
import { PencilIcon } from "@/icons";

type SiteRecord = {
  unique_id?: string;
  id?: string | number;
  site_name?: string;
  state?: string;
  district?: string;
  state_id?: string;
  district_id?: string;
  state_name?: string;
  district_name?: string;
  ulb?: string;
  status?: string;
  is_active?: boolean;
  project_value?: number | string;
  project_type_details?: string;
  weighbridge_count?: number | string;
};

export default function SiteCreationList() {
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const { encMasters, encSiteCreation } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encMasters}/${encSiteCreation}/new`;
  const ENC_EDIT_PATH = (id: string | number) =>
    `/${encMasters}/${encSiteCreation}/${id}/edit`;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const [siteData, states, districts] = await Promise.all([
          siteApi.list(),
          stateApi.list(),
          districtApi.list(),
        ]);

        const stateMap = new Map<string, string>();
        (states as any[]).forEach((state) => {
          const key = String(state.unique_id ?? state.id ?? state.name ?? "");
          if (!key) return;
          stateMap.set(key, state.name ?? key);
          if (state.name) {
            stateMap.set(String(state.name), state.name);
          }
        });

        const districtMap = new Map<string, string>();
        (districts as any[]).forEach((district) => {
          const key = String(
            district.unique_id ?? district.id ?? district.name ?? ""
          );
          if (!key) return;
          districtMap.set(key, district.name ?? key);
          if (district.name) {
            districtMap.set(String(district.name), district.name);
          }
        });

        const mapped = (siteData as SiteRecord[]).map((site) => {
          const stateKey =
            site.state_id ?? site.state_name ?? site.state ?? "";
          const districtKey =
            site.district_id ?? site.district_name ?? site.district ?? "";

          return {
            ...site,
            state:
              site.state_name ??
              (stateKey ? stateMap.get(String(stateKey)) : undefined) ??
              site.state,
            district:
              site.district_name ??
              (districtKey ? districtMap.get(String(districtKey)) : undefined) ??
              site.district,
            status:
              site.status ??
              (site.is_active !== undefined
                ? site.is_active
                  ? "Active"
                  : "Inactive"
                : undefined),
          };
        });

        setSites(mapped);
      } catch (error) {
        console.error("Failed to load sites", error);
        Swal.fire("Error", "Failed to load sites", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

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
        value={sites}
        header={header}
        emptyMessage="No sites available."
        stripedRows
        showGridlines
        className="p-datatable-sm"
        dataKey="unique_id"
        loading={loading}
        onRowDoubleClick={(event) => {
          const row = event.data as SiteRecord | undefined;
          const id = row?.unique_id ?? row?.id;
          if (id) {
            navigate(ENC_EDIT_PATH(id));
          }
        }}
      >
        <Column header="Site Name" field="site_name" />
        <Column header="State" field="state" />
        <Column header="District" field="district" />
        <Column header="ULB" field="ulb" />
        <Column
          header="Status"
          body={(row: SiteRecord) => (
            <Switch checked={row.status === "Active"} />
          )}
        />
        <Column header="Project Value" field="project_value" />
        <Column header="Project Type" field="project_type_details" />
        <Column header="Weighbridge Count" field="weighbridge_count" />
        <Column
          header="Actions"
          body={(row: SiteRecord) => {
            const id = row.unique_id ?? row.id;
            return (
              <div className="flex justify-center">
                <button
                  onClick={() => id && navigate(ENC_EDIT_PATH(id))}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <PencilIcon className="size-5" />
                </button>
              </div>
            );
          }}
        />
      </DataTable>
    </div>
  );
}
