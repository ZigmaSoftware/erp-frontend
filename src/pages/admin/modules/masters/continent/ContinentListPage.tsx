import { useState } from "react";
import { DataTable } from "primereact/datatable";
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
     State
  ------------------------------ */
  const [lazyParams, setLazyParams] = useState({
    page: 1,
    rows: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");

  /* ------------------------------
     Query (TanStack v5 Correct)
  ------------------------------ */
  const query = useQuery({
    queryKey: continentListQueryKey(lazyParams.page, lazyParams.rows),
    queryFn: async (): Promise<
      PaginatedResponse<ContinentRecord>
    > => {
      return continentApi.listPaginated(
        lazyParams.page,
        lazyParams.rows
      );
    },
    placeholderData: keepPreviousData, // ✅ v5 replacement
  });

  const continents = query.data?.results ?? [];
  console.log(continents);
  const totalRecords = query.data?.count ?? 0;
  const loading = query.isLoading || query.isFetching;

  /* ------------------------------
     Mutation (v5 Correct)
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
          lazyParams.page,
          lazyParams.rows
        ),
      });
    },

    onError: () => {
      Swal.fire("Error", "Status update failed", "error");
    },
  });

  const isUpdating = mutation.isPending; // ✅ v5 uses isPending

  /* ------------------------------
     Pagination
  ------------------------------ */
  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

  /* ------------------------------
     Status Toggle
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
     Actions
  ------------------------------ */
  const actionTemplate = (row: ContinentRecord) => (
    <button
      onClick={() =>
        navigate(ENC_EDIT_PATH(String(row.unique_id)))
      }
      className="text-blue-600 hover:text-blue-800"
      title="Edit"
    >
      <PencilIcon className="size-5" />
    </button>
  );

  const indexTemplate = (_: any, options: any) =>
    (lazyParams.page - 1) * lazyParams.rows +
    options.rowIndex +
    1;

  const cap = (str?: string) =>
    str
      ? str.charAt(0).toUpperCase() +
        str.slice(1).toLowerCase()
      : "";

  /* ------------------------------
     Header
  ------------------------------ */
  const header = (
    <div className="flex justify-end">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) =>
            setGlobalFilter(e.target.value)
          }
          placeholder="Search (UI only)"
          className="p-inputtext-sm"
        />
      </span>
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
        rowsPerPageOptions={[5, 10, 20, 50]}
        first={
          (lazyParams.page - 1) *
          lazyParams.rows
        }
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
