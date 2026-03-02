import { useState } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { continentApi } from "@/helpers/admin";
import { PencilIcon } from "@/icons";
import type { PaginatedResponse } from "@/helpers/admin";
import type { ContinentRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

/* -----------------------------------------
   Routes
----------------------------------------- */
const encMasters = encryptSegment("masters");
const encContinents = encryptSegment("continents");

const ENC_NEW_PATH = `/${encMasters}/${encContinents}/new`;
const ENC_EDIT_PATH = (id: string) =>
  `/${encMasters}/${encContinents}/${id}/edit`;

const continentListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.continents, "list", page, rows] as const;

/* -----------------------------------------
   Component
----------------------------------------- */
export default function ContinentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /* ------------------------------
     State (PrimeReact Correct Way)
     first = starting row index
  ------------------------------ */
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 5, // Match backend default if needed
  });

  const [globalFilter, setGlobalFilter] = useState("");

  /* ------------------------------
     Derived Page (1-based for backend)
  ------------------------------ */
  const currentPage =
    Math.floor(lazyParams.first / lazyParams.rows) + 1;

  /* ------------------------------
     Query
  ------------------------------ */
  const query = useQuery({
    queryKey: continentListQueryKey(
      currentPage,
      lazyParams.rows
    ),
    queryFn: async (): Promise<
      PaginatedResponse<ContinentRecord>
    > => {
      return continentApi.listPaginated(
        currentPage,
        lazyParams.rows
      );
    },
    placeholderData: keepPreviousData,
  });

  const continents = query.data?.results ?? [];
  const totalRecords = query.data?.count ?? 0;
  const loading = query.isLoading || query.isFetching;

  /* ------------------------------
     Mutation (Status Toggle)
  ------------------------------ */
  const mutation = useMutation({
    mutationFn: (payload: {
      id: string | number;
      name: string;
      is_active: boolean;
    }) => continentApi.update(payload.id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: continentListQueryKey(
          currentPage,
          lazyParams.rows
        ),
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
  const onPage = (event: DataTablePageEvent) => {
    setLazyParams({
      first: event.first,
      rows: event.rows,
    });
  };

  /* ------------------------------
     Serial Number Column
  ------------------------------ */
  const indexTemplate = (_: any, options: any) =>
    lazyParams.first + options.rowIndex + 1;

  /* ------------------------------
     Status Column
  ------------------------------ */
  const statusTemplate = (row: ContinentRecord) => (
    <Switch
      checked={row.is_active}
      onCheckedChange={(checked) =>
        mutation.mutate({
          id: row.unique_id,
          name: row.name,
          is_active: checked,
        })
      }
      disabled={isUpdating}
    />
  );

  /* ------------------------------
     Actions Column
  ------------------------------ */
  const actionTemplate = (row: ContinentRecord) => (
    <button
      onClick={() =>
        navigate(
          ENC_EDIT_PATH(String(row.unique_id))
        )
      }
      className="text-blue-600 hover:text-blue-800"
      title="Edit"
    >
      <PencilIcon className="size-5" />
    </button>
  );

  /* ------------------------------
     Capitalize Utility
  ------------------------------ */
  const cap = (str?: string) =>
    str
      ? str.charAt(0).toUpperCase() +
        str.slice(1).toLowerCase()
      : "";

  /* ------------------------------
     Header
  ------------------------------ */
  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
         value={globalFilter}
          onChange={(e) =>
            setGlobalFilter(e.target.value)
          }
          placeholder="Search Continents"
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
          <h1 className="text-3xl font-bold text-gray-800">
            Continents
          </h1>
          <p className="text-gray-500 text-sm">
            Manage continent records
          </p>
        </div>

        <Button
          label="Add Continent"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={continents}
        lazy
        paginator
        rows={lazyParams.rows}
        first={lazyParams.first}
        rowsPerPageOptions={[5, 10, 20, 50]}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        dataKey="unique_id"
        header={header}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column
          header="S.No"
          body={indexTemplate}
          style={{ width: "80px" }}
        />

        <Column
          field="name"
          header="Continent Name"
          style={{ minWidth: "200px" }}
          body={(row: ContinentRecord) =>
            cap(row.name)
          }
        />

        <Column
          header="Status"
          body={statusTemplate}
          style={{
            width: "150px",
            textAlign: "center",
          }}
        />

        <Column
          header="Actions"
          body={actionTemplate}
          style={{
            width: "120px",
            textAlign: "center",
          }}
        />
      </DataTable>
    </div>
  );
}