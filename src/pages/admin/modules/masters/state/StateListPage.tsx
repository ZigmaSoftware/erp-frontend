import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import { stateApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { PaginatedResponse } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";

type StateRecord = {
  unique_id: string;
  name: string;
  country_name: string;
  label: string;
  is_active: boolean;
};

const stateListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.states, "list", page, rows] as const;

export default function StateList() {
  const [lazyParams, setLazyParams] = useState({ page: 1, rows: 10 });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const encMasters = encryptSegment("masters");
  const encStates = encryptSegment("states");

  const ENC_NEW_PATH = `/${encMasters}/${encStates}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encMasters}/${encStates}/${unique_id}/edit`;

  const query = useQuery<PaginatedResponse<StateRecord>>({
    queryKey: stateListQueryKey(lazyParams.page, lazyParams.rows),
    queryFn: () => stateApi.listPaginated(lazyParams.page, lazyParams.rows),
  });

  useEffect(() => {
    if (query.error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load states",
        text: extractErrorMessage(query.error),
      });
    }
  }, [query.error]);

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; is_active: boolean }) =>
      stateApi.update(payload.id, { is_active: payload.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.states,
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
  const totalRecords = query.data?.count ?? 0;
  const states = query.data?.results ?? [];
  const loading = query.isLoading || query.isFetching;

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search states..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: StateRecord) => (
    <Switch
      checked={row.is_active}
      disabled={isUpdatingStatus}
      onCheckedChange={(value) =>
        statusMutation.mutate({ id: row.unique_id, is_active: value })
      }
    />
  );

  const actionTemplate = (row: StateRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: StateRecord, { rowIndex }: any) =>
    (lazyParams.page - 1) * lazyParams.rows + rowIndex + 1;

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">States</h1>
          <p className="text-gray-500 text-sm">Manage state records</p>
        </div>

        <Button
          label="Add State"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={states}
        dataKey="unique_id"
        lazy
        paginator
        rows={lazyParams.rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={(lazyParams.page - 1) * lazyParams.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No states found."
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
          field="name"
          header="State Name"
          body={(r) => cap(r.name)}
          sortable
        />
        <Column field="label" header="Label" />
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
