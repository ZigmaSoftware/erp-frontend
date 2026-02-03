import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

import { districtApi, siteApi, stateApi } from "@/helpers/admin";
import { Switch } from "@/components/ui/switch";
import { getEncryptedRoute } from "@/utils/routeCache";
import { PencilIcon } from "@/icons";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

/* ================= TYPES ================= */

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
  is_active?: boolean;
  status?: string;
  project_value?: number | string;
  project_type_details?: string;
  weighbridge_count?: number | string;
};

/* ================= COMPONENT ================= */

export default function SiteCreationList() {
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    page: 1,
    rows: 10,
  });

  /* ---- search state (same as PlantList) ---- */
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const { encMasters, encSiteCreation } = getEncryptedRoute();
  const ENC_NEW_PATH = `/${encMasters}/${encSiteCreation}/new`;
  const ENC_EDIT_PATH = (id: string | number) =>
    `/${encMasters}/${encSiteCreation}/${id}/edit`;

  const navigate = useNavigate();

  /* ================= STATUS UPDATE ================= */

  const updateStatus = async (row: SiteRecord, value: boolean) => {
    const id = row.unique_id ?? row.id;
    if (!id) return;

    // optimistic UI
    setSites((prev) =>
      prev.map((s) =>
        (s.unique_id ?? s.id) === id
          ? {
              ...s,
              is_active: value,
              status: value ? "Active" : "Inactive",
            }
          : s
      )
    );

    try {
      await siteApi.update(id, {
        is_active: value ? 1 : 0,
        status: value ? "Active" : "Inactive",
      });
    } catch {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  /* ================= FETCH ================= */

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);

      const [siteRes, states, districts] = await Promise.all([
        siteApi.listPaginated(lazyParams.page, lazyParams.rows),
        stateApi.list(),
        districtApi.list(),
      ]);

      const stateMap = new Map<string, string>();
      states.forEach((s: any) => {
        const k = String(s.unique_id ?? s.id ?? s.name ?? "");
        if (k) stateMap.set(k, s.name);
      });

      const districtMap = new Map<string, string>();
      districts.forEach((d: any) => {
        const k = String(d.unique_id ?? d.id ?? d.name ?? "");
        if (k) districtMap.set(k, d.name);
      });

      const mapped = (siteRes.results ?? []).map((site: SiteRecord) => ({
        ...site,
        state:
          site.state_name ??
          stateMap.get(String(site.state_id)) ??
          site.state,
        district:
          site.district_name ??
          districtMap.get(String(site.district_id)) ??
          site.district,
        status:
          site.is_active !== undefined
            ? site.is_active
              ? "Active"
              : "Inactive"
            : site.status,
      }));

      setSites(mapped);
      setTotalRecords(siteRes.count ?? 0);
    } catch {
      Swal.fire("Error", "Failed to load sites", "error");
    } finally {
      setLoading(false);
    }
  }, [lazyParams.page, lazyParams.rows]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  /* ================= SEARCH HANDLER ================= */

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  /* ================= DATATABLE HEADER (SEARCH ONLY) ================= */

  const tableHeader = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search sites..."
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

  /* ================= RENDER ================= */

  return (
    <div className="p-3">
      {/* PAGE HEADER (matches screenshot) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Master / Site Creation List
          </h1>
          <p className="text-gray-500 text-sm">
            Manage site records
          </p>
        </div>

        <Link
          to={ENC_NEW_PATH}
          className="p-button p-button-success"
        >
          + Add Site
        </Link>
      </div>

      {/* TABLE */}
      <DataTable
        value={sites}
        dataKey="unique_id"
        loading={loading}
        lazy
        paginator
        rows={lazyParams.rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={(lazyParams.page - 1) * lazyParams.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        header={tableHeader}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="Site Name" field="site_name" sortable />
        <Column header="State" field="state" sortable />
        <Column header="District" field="district" sortable />
        <Column header="ULB" field="ulb" sortable />

        <Column
          header="Status"
          body={(row: SiteRecord) => (
            <Switch
              checked={!!row.is_active}
              onCheckedChange={(v) => updateStatus(row, v)}
            />
          )}
          style={{ textAlign: "center", width: "140px" }}
        />

        <Column header="Project Value" field="project_value" sortable />
        <Column header="Project Type" field="project_type_details" sortable />
        <Column header="Weighbridge Count" field="weighbridge_count" sortable />

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
          style={{ textAlign: "center", width: "140px" }}
        />
      </DataTable>
    </div>
  );
}
