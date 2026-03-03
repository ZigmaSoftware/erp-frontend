import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Switch } from "@/components/ui/switch";
import { PencilIcon } from "@/icons";
import { siteApi } from "@/helpers/admin";
import type { PaginatedResponse } from "@/helpers/admin/crudHelpers";
import {
  useDistrictsSelectOptions,
  useStatesSelectOptions,
} from "@/tanstack/admin";
import {
  masterQueryKeys,
  type SiteRecord,
} from "@/types/tanstack/masters";
import { encryptSegment } from "@/utils/routeCrypto";

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encSiteCreation = encryptSegment("site-creation");

const ENC_NEW_PATH = `/${encMasters}/${encSiteCreation}/new`;
const ENC_EDIT_PATH = (id: string | number) =>
  `/${encMasters}/${encSiteCreation}/${id}/edit`;

/* ---------------- TYPES ---------------- */

type PaginatedSites = PaginatedResponse<SiteRecord>;

/* ---------------- COMPONENT ---------------- */

export default function SiteCreationList() {
  const [lazyParams, setLazyParams] = useState({ page: 1, rows: 10 });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ---------------- QUERY KEY ---------------- */

  const siteQueryKey = useMemo(
    () =>
      [
        ...masterQueryKeys.sites,
        "paginated",
        lazyParams.page,
        lazyParams.rows,
      ] as const,
    [lazyParams.page, lazyParams.rows]
  );

  /* ---------------- PAGINATED QUERY (TanStack v5) ---------------- */

  const siteQuery = useQuery({
    queryKey: siteQueryKey,
    queryFn: async (): Promise<PaginatedSites> =>
      await siteApi.listPaginated(
        lazyParams.page,
        lazyParams.rows
      ),
    placeholderData: (prev) => prev,
  });

  /* ---------------- MASTER DATA ---------------- */

  const statesQuery = useStatesSelectOptions();
  const districtsQuery = useDistrictsSelectOptions();

  const stateOptions = statesQuery.selectOptions ?? [];
  const districtOptions = districtsQuery.selectOptions ?? [];

  const stateLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    stateOptions.forEach((opt) =>
      map.set(opt.value, typeof opt.label === "string" ? opt.label : String(opt.label ?? ""))
    );
    return map;
  }, [stateOptions]);

  const districtLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    districtOptions.forEach((opt) =>
      map.set(opt.value, typeof opt.label === "string" ? opt.label : String(opt.label ?? ""))
    );
    return map;
  }, [districtOptions]);

  /* ---------------- TABLE DATA ---------------- */

  const siteRows = useMemo(() => {
    return (siteQuery.data?.results ?? []).map(
      (site: SiteRecord) => ({
        ...site,
        state:
          site.state_name ??
          stateLabelMap.get(
            String(site.state_id ?? "")
          ) ??
          "",
        district:
          site.district_name ??
          districtLabelMap.get(
            String(site.district_id ?? "")
          ) ??
          "",
        status: site.is_active
          ? "Active"
          : "Inactive",
      })
    );
  }, [siteQuery.data, stateLabelMap, districtLabelMap]);

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredSites = useMemo(() => {
    if (!globalFilterValue.trim()) return siteRows;

    const term = globalFilterValue.toLowerCase();

    return siteRows.filter((site: SiteRecord) =>
      [
        site.site_name,
        (site as any).state,
        (site as any).district,
        site.ulb,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(term)
        )
    );
  }, [globalFilterValue, siteRows]);

  /* ---------------- PAGINATION ---------------- */

  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

  const totalRecords =
    siteQuery.data?.count ?? 0;

  /* ---------------- STATUS UPDATE ---------------- */

  const updateStatus = async (
    row: SiteRecord,
    value: boolean
  ) => {
    const id =
      row.unique_id ?? (row as any).id;
    if (!id) return;

    const previousData =
      siteQuery.data;

    queryClient.setQueryData(
      siteQueryKey,
      (data: PaginatedSites | undefined) => {
        if (!data) return data;

        return {
          ...data,
          results: data.results.map(
            (site: SiteRecord) =>
              (site.unique_id ??
                (site as any).id) === id
                ? {
                    ...site,
                    is_active: value,
                  }
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
      queryClient.setQueryData(
        siteQueryKey,
        previousData
      );

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
          onChange={(e) =>
            setGlobalFilterValue(e.target.value)
          }
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

        <Link
          to={ENC_NEW_PATH}
          className="p-button p-button-success"
        >
          + Add Site
        </Link>
      </div>

      <DataTable
        value={filteredSites}
        dataKey="unique_id"
        loading={siteQuery.isFetching}
        lazy
        paginator
        rows={lazyParams.rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={
          (lazyParams.page - 1) *
          lazyParams.rows
        }
        totalRecords={totalRecords}
        onPage={onPage}
        header={tableHeader}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column
          header="Site Name"
          field="site_name"
          sortable
        />
        <Column
          header="State"
          field="state"
          sortable
        />
        <Column
          header="District"
          field="district"
          sortable
        />
        <Column
          header="ULB"
          field="ulb"
          sortable
        />

        <Column
          header="Status"
          body={(row: SiteRecord) => (
            <Switch
              checked={!!row.is_active}
              onCheckedChange={(v) =>
                updateStatus(row, v)
              }
            />
          )}
          style={{
            textAlign: "center",
            width: "140px",
          }}
        />

        <Column
          header="Project Value"
          field="project_value"
          sortable
        />
        <Column
          header="Project Type"
          field="project_type_details"
          sortable
        />
        <Column
          header="Weighbridge Count"
          field="weighbridge_count"
          sortable
        />

        <Column
          header="Actions"
          body={(row: SiteRecord) => {
            const id =
              row.unique_id ??
              (row as any).id;

            return (
              <div className="flex justify-center">
                <button
                  onClick={() =>
                    id &&
                    navigate(
                      ENC_EDIT_PATH(id)
                    )
                  }
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <PencilIcon className="size-5" />
                </button>
              </div>
            );
          }}
          style={{
            textAlign: "center",
            width: "140px",
          }}
        />
      </DataTable>
    </div>
  );
}
