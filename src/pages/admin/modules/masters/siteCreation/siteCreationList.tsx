import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Switch } from "@/components/ui/switch";
import { PencilIcon } from "@/icons";
import { siteApi } from "@/helpers/admin";
import {
  useDistrictsSelectOptions,
  useStatesSelectOptions,
} from "@/tanstack/admin";
import {
  masterQueryKeys,
  type SiteRecord,
} from "@/types/tanstack/masters";
import type { PaginatedSites, SiteTableRow } from "@/types/masters/lists";
import { encryptSegment } from "@/utils/routeCrypto";

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encSiteCreation = encryptSegment("site-creation");

const ENC_NEW_PATH = `/${encMasters}/${encSiteCreation}/new`;
const ENC_EDIT_PATH = (id: string | number) =>
  `/${encMasters}/${encSiteCreation}/${id}/edit`;

/* ---------------- COMPONENT ---------------- */

export default function SiteCreationList() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  const [displayedPage, setDisplayedPage] = useState(1);
  const [displayedRows, setDisplayedRows] = useState(10);

  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ---------------- QUERY KEY ---------------- */

  const siteQueryKey = useMemo(
    () => [...masterQueryKeys.sites, "paginated", page, rows] as const,
    [page, rows]
  );

  /* ---------------- QUERY ---------------- */

  const siteQuery = useQuery({
    queryKey: siteQueryKey,
    queryFn: async (): Promise<PaginatedSites> =>
      await siteApi.listPaginated(page, rows),

    placeholderData: keepPreviousData,

    onSuccess: () => {
      setDisplayedPage(page);
      setDisplayedRows(rows);
    },
  });

  /* ---------------- MASTER DATA ---------------- */

  const statesQuery = useStatesSelectOptions();
  const districtsQuery = useDistrictsSelectOptions();

  const stateOptions = statesQuery.selectOptions ?? [];
  const districtOptions = districtsQuery.selectOptions ?? [];

  const stateLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    stateOptions.forEach((opt) =>
      map.set(
        opt.value,
        typeof opt.label === "string" ? opt.label : String(opt.label ?? "")
      )
    );
    return map;
  }, [stateOptions]);

  const districtLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    districtOptions.forEach((opt) =>
      map.set(
        opt.value,
        typeof opt.label === "string" ? opt.label : String(opt.label ?? "")
      )
    );
    return map;
  }, [districtOptions]);

  /* ---------------- TABLE DATA ---------------- */

  const siteRows = useMemo<SiteTableRow[]>(() => {
    return (siteQuery.data?.results ?? []).map((site: SiteRecord) => ({
      ...site,
      state:
        site.state_name ??
        stateLabelMap.get(String(site.state_id ?? "")) ??
        "",
      district:
        site.district_name ??
        districtLabelMap.get(String(site.district_id ?? "")) ??
        "",
      status: site.is_active ? "Active" : "Inactive",
    }));
  }, [siteQuery.data, stateLabelMap, districtLabelMap]);

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredSites = useMemo(() => {
    if (!globalFilterValue.trim()) return siteRows;

    const term = globalFilterValue.toLowerCase();

    return siteRows.filter((site: SiteTableRow) =>
      [site.site_name, site.state, site.district, site.ulb]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [globalFilterValue, siteRows]);

  /* ---------------- PAGINATION ---------------- */

  const onPage = (event: any) => {
    const newRows = event.rows;
    const newPage = Math.floor(event.first / event.rows) + 1;

    setRows(newRows);
    setPage(newPage);
  };

  const totalRecords = siteQuery.data?.count ?? 0;

  const indexTemplate = (
    _: SiteRecord,
    { rowIndex }: { rowIndex: number }
  ) =>
    (displayedPage - 1) * displayedRows + rowIndex + 1;

  /* ---------------- STATUS UPDATE ---------------- */

  const updateStatus = async (row: SiteTableRow, value: boolean) => {
    const id = row.unique_id ?? (row as any).id;
    if (!id) return;

    const previousData = siteQuery.data;

    queryClient.setQueryData(
      siteQueryKey,
      (data: PaginatedSites | undefined) => {
        if (!data) return data;

        return {
          ...data,
          results: data.results.map((site: SiteRecord) =>
            (site.unique_id ?? (site as any).id) === id
              ? { ...site, is_active: value }
              : site
          ),
        };
      }
    );

    try {
      await siteApi.update(id, {
        is_active: value ? 1 : 0,
      });
    } catch {
      queryClient.setQueryData(siteQueryKey, previousData);

      Swal.fire({
        title: "Error",
        text: "Failed to update status",
        icon: "error",
      });
    }
  };

  /* ---------------- TABLE HEADER ---------------- */

  const tableHeader = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Search sites..."
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Master / Site Creation List
          </h1>
          <p className="text-gray-500 text-sm">
            Manage site records
          </p>
        </div>

        <Link to={ENC_NEW_PATH} className="p-button p-button-success">
          + Add Site
        </Link>
      </div>

      <DataTable
        value={filteredSites}
        dataKey="unique_id"
        loading={siteQuery.isLoading || siteQuery.isFetching}
        lazy
        paginator
        rows={rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={(page - 1) * rows}
        totalRecords={totalRecords}
        onPage={onPage}
        header={tableHeader}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

        <Column header="Site Name" field="site_name" sortable />
        <Column header="State" field="state" sortable />
        <Column header="District" field="district" sortable />
        <Column header="ULB" field="ulb" sortable />

        <Column
          header="Status"
          body={(row: SiteTableRow) => (
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
          body={(row: SiteTableRow) => {
            const id = row.unique_id ?? (row as any).id;

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