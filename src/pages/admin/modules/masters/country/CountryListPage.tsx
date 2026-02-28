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
import { countryApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { PaginatedResponse } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";

type CountryRecord = {
  unique_id: string;
  name: string;
  continent_name: string;
  mob_code: string;
  currency: string;
  is_active: boolean;
};

const countryListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.countries, "list", page, rows] as const;

export default function CountryList() {
  const [lazyParams, setLazyParams] = useState({ page: 1, rows: 10 });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const encMasters = encryptSegment("masters");
  const encCountries = encryptSegment("countries");

  const ENC_NEW_PATH = `/${encMasters}/${encCountries}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encMasters}/${encCountries}/${unique_id}/edit`;

  const query = useQuery<PaginatedResponse<CountryRecord>>({
    queryKey: countryListQueryKey(lazyParams.page, lazyParams.rows),
    queryFn: () => countryApi.listPaginated(lazyParams.page, lazyParams.rows),
  });

  useEffect(() => {
    if (query.error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load countries",
        text: extractErrorMessage(query.error),
      });
    }
  }, [query.error]);

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; is_active: boolean }) =>
      countryApi.update(payload.id, { is_active: payload.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.countries,
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
  const countries = query.data?.results ?? [];
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
          placeholder="Search Countries..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: CountryRecord) => (
    <Switch
      checked={row.is_active}
      disabled={isUpdatingStatus}
      onCheckedChange={(value) =>
        statusMutation.mutate({ id: row.unique_id, is_active: value })
      }
    />
  );

  const actionTemplate = (c: CountryRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(c.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: CountryRecord, { rowIndex }: any) =>
    (lazyParams.page - 1) * lazyParams.rows + rowIndex + 1;

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
        rows={lazyParams.rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={(lazyParams.page - 1) * lazyParams.rows}
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
