import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon } from "@/icons";
import { encryptSegment } from "@/utils/routeCrypto";
import { Switch } from "@/components/ui/switch";
import { districtApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { PaginatedResponse } from "@/helpers/admin";
import { masterQueryKeys, type DistrictRecord } from "@/types/tanstack/masters";

const districtListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.districts, "list", page, rows] as const;

export default function DistrictListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ------------------------------
     Pagination States
  ------------------------------ */
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [first, setFirst] = useState(0);

  const [displayedPage, setDisplayedPage] = useState(1);
  const [displayedRows, setDisplayedRows] = useState(10);

  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const encMasters = encryptSegment("masters");
  const encDistricts = encryptSegment("districts");

  const ENC_NEW_PATH = `/${encMasters}/${encDistricts}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encDistricts}/${id}/edit`;

  /* ------------------------------
     Query
  ------------------------------ */
  const query = useQuery<PaginatedResponse<DistrictRecord>>({
    queryKey: districtListQueryKey(page, rows),
    queryFn: () => districtApi.listPaginated(page, rows),
    placeholderData: keepPreviousData,
    onSuccess: () => {
      setDisplayedPage(page);
      setDisplayedRows(rows);
    },
  });

  useEffect(() => {
    if (query.error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load districts",
        text: extractErrorMessage(query.error),
      });
    }
  }, [query.error]);

  /* ------------------------------
     Mutation
  ------------------------------ */
  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; is_active: boolean }) =>
      districtApi.update(payload.id, { is_active: payload.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: districtListQueryKey(page, rows),
      });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Failed to update status",
        text: extractErrorMessage(error),
      });
    },
  });

  const isUpdatingStatus = statusMutation.isPending;

  /* ------------------------------
     Data
  ------------------------------ */
  const districts = useMemo<DistrictRecord[]>(() => {
    const results = query.data?.results ?? [];
    return [...results].sort((a, b) => a.name.localeCompare(b.name));
  }, [query.data]);

  const totalRecords = query.data?.count ?? 0;
  const loading = query.isLoading || query.isFetching;

  /* ------------------------------
     Search
  ------------------------------ */
  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  /* ------------------------------
     Pagination
  ------------------------------ */
  const onPage = (event: any) => {
    const newRows = event.rows;
    const newPage = Math.floor(event.first / event.rows) + 1;

    setRows(newRows);
    setPage(newPage);
    setFirst(event.first);
  };

  /* ------------------------------
     Header
  ------------------------------ */
  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Districts..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  /* ------------------------------
     Templates
  ------------------------------ */
  const statusTemplate = (row: DistrictRecord) => (
    <Switch
      checked={row.is_active}
      disabled={isUpdatingStatus}
      onCheckedChange={(value) =>
        statusMutation.mutate({ id: String(row.unique_id), is_active: value })
      }
    />
  );

  const actionTemplate = (row: DistrictRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(String(row.unique_id)))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: DistrictRecord, options: any) =>
    (displayedPage - 1) * displayedRows + options.rowIndex + 1;

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Districts</h1>
          <p className="text-gray-500 text-sm">Manage district records</p>
        </div>

        <Button
          label="Add District"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={districts}
        dataKey="unique_id"
        loading={loading}
        lazy
        paginator
        rows={rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={first}
        totalRecords={totalRecords}
        onPage={onPage}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No districts found."
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

        <Column
          field="country_name"
          header="Country"
          body={(r) => cap(r.country_name)}
          sortable
        />

        <Column
          field="state_name"
          header="State"
          body={(r) => cap(r.state_name)}
          sortable
        />

        <Column
          field="name"
          header="District"
          body={(r) => cap(r.name)}
          sortable
        />

        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />

        <Column
          header="Actions"
          body={actionTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}