import { useEffect, useMemo, useState } from "react";
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
import { districtApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { PaginatedResponse } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";

type DistrictRecord = {
  unique_id: string;
  country_name: string;
  state_name: string;
  name: string;
  is_active: boolean;
};

const districtListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.districts, "list", page, rows] as const;

export default function DistrictListPage() {
  const [lazyParams, setLazyParams] = useState({ page: 1, rows: 10 });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const encMasters = encryptSegment("masters");
  const encDistricts = encryptSegment("districts");

  const ENC_NEW_PATH = `/${encMasters}/${encDistricts}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encDistricts}/${id}/edit`;

  const query = useQuery<PaginatedResponse<DistrictRecord>>({
    queryKey: districtListQueryKey(lazyParams.page, lazyParams.rows),
    queryFn: () => districtApi.listPaginated(lazyParams.page, lazyParams.rows),
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

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; is_active: boolean }) =>
      districtApi.update(payload.id, { is_active: payload.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.districts,
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

  const districts = useMemo<DistrictRecord[]>(() => {
    const results = query.data?.results ?? [];
    return [...results].sort((a, b) => a.name.localeCompare(b.name));
  }, [query.data]);
  console.log(districts);

  const totalRecords = query.data?.count ?? 0;
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
          placeholder="Search Districts..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: DistrictRecord) => (
    <Switch
      checked={row.is_active}
      disabled={isUpdatingStatus}
      onCheckedChange={(value) =>
        statusMutation.mutate({ id: row.unique_id, is_active: value })
      }
    />
  );

  const actionTemplate = (row: DistrictRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: DistrictRecord, { rowIndex }: any) =>
    (lazyParams.page - 1) * lazyParams.rows + rowIndex + 1;

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
        rows={lazyParams.rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={(lazyParams.page - 1) * lazyParams.rows}
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
