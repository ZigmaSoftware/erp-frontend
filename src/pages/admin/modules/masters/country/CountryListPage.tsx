import { useEffect, useState } from "react";
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
import { countryApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { PaginatedResponse } from "@/helpers/admin";
import { masterQueryKeys, type CountryRecord } from "@/types/tanstack/masters";

const countryListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.countries, "list", page, rows] as const;

export default function CountryList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ------------------------------
     Pagination States (same as ContinentList)
  ------------------------------ */
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(5);
  const [first, setFirst] = useState(0);

  const [displayedPage, setDisplayedPage] = useState(1);
  const [displayedRows, setDisplayedRows] = useState(5);

  const [globalFilterValue, setGlobalFilterValue] = useState("");

  /* ------------------------------
     Routes
  ------------------------------ */
  const encMasters = encryptSegment("masters");
  const encCountries = encryptSegment("countries");

  const ENC_NEW_PATH = `/${encMasters}/${encCountries}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encMasters}/${encCountries}/${unique_id}/edit`;

  /* ------------------------------
     Query
  ------------------------------ */
  const query = useQuery<PaginatedResponse<CountryRecord>>({
    queryKey: countryListQueryKey(page, rows),
    queryFn: async (): Promise<PaginatedResponse<CountryRecord>> =>
      countryApi.listPaginated(page, rows),
    placeholderData: keepPreviousData,
    onSuccess: () => {
      setDisplayedPage(page);
      setDisplayedRows(rows);
    },
  });

  const countries = query.data?.results ?? [];
  const totalRecords = query.data?.count ?? 0;
  const loading = query.isLoading || query.isFetching;

  useEffect(() => {
    if (query.error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load countries",
        text: extractErrorMessage(query.error),
      });
    }
  }, [query.error]);

  /* ------------------------------
     Mutation (Status Toggle)
  ------------------------------ */
  const mutation = useMutation({
    mutationFn: (payload: { id: string | number; is_active: boolean }) =>
      countryApi.update(payload.id, { is_active: payload.is_active }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: countryListQueryKey(page, rows),
      });
    },

    onError: () => {
      Swal.fire("Error", "Status update failed", "error");
    },
  });

  const isUpdating = mutation.isPending;

  /* ------------------------------
     Pagination Handler
  ------------------------------ */
  const onPage = (event: any) => {
    const newRows = event.rows;
    const newPage = Math.floor(event.first / event.rows) + 1;

    setRows(newRows);
    setPage(newPage);
    setFirst(event.first);
  };

  /* ------------------------------
     Serial Number Logic
  ------------------------------ */
  const indexTemplate = (_: CountryRecord, options: any) => {
    return (displayedPage - 1) * displayedRows + options.rowIndex + 1;
  };

  /* ------------------------------
     Search
  ------------------------------ */
  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  /* ------------------------------
     Utilities
  ------------------------------ */
  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  /* ------------------------------
     Status Column
  ------------------------------ */
  const statusTemplate = (row: CountryRecord) => (
    <Switch
      checked={row.is_active}
      onCheckedChange={(checked) =>
        mutation.mutate({
          id: row.unique_id,
          is_active: checked,
        })
      }
      disabled={isUpdating}
    />
  );

  /* ------------------------------
     Actions Column
  ------------------------------ */
  const actionTemplate = (c: CountryRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(String(c.unique_id)))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

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
          placeholder="Search Countries..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* ------------------------------
     Render
  ------------------------------ */
  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Countries</h1>
          <p className="text-gray-500 text-sm">Manage country records</p>
        </div>

        <Button
          label="Add Country"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={countries}
        dataKey="unique_id"
        lazy
        paginator
        rows={rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={first}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No countries found."
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

        <Column
          field="continent_name"
          header="Continent"
          body={(r) => cap(r.continent_name)}
          sortable
        />

        <Column
          field="name"
          header="Country Name"
          body={(r) => cap(r.name)}
          sortable
        />

        <Column field="mob_code" header="Mob Code" />

        <Column field="currency" header="Currency" />

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