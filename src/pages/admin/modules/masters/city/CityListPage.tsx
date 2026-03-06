import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
import { cityApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { PaginatedResponse } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";

type CityRecord = {
  unique_id: string;
  name: string;
  is_active: boolean;
  country_name: string;
  state_name: string;
  district_name: string;
};

const cityListQueryKey = (page: number, rows: number) =>
  [...masterQueryKeys.cities, "list", page, rows] as const;

export default function CityList() {
  const [lazyParams, setLazyParams] = useState({ page: 1, rows: 10 });
  const [displayedLazyParams, setDisplayedLazyParams] = useState({
    page: 1,
    rows: 10,
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const encMasters = encryptSegment("masters");
  const encCities = encryptSegment("cities");

  const ENC_NEW_PATH = `/${encMasters}/${encCities}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encCities}/${id}/edit`;

  /* ---------------- QUERY ---------------- */

  const query = useQuery<PaginatedResponse<CityRecord>>({
    queryKey: cityListQueryKey(lazyParams.page, lazyParams.rows),
    queryFn: () =>
      cityApi.listPaginated(lazyParams.page, lazyParams.rows),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (query.error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load cities",
        text: extractErrorMessage(query.error),
      });
    }
  }, [query.error]);

  useEffect(() => {
    if (!query.isLoading && !query.isFetching) {
      setDisplayedLazyParams(lazyParams);
    }
  }, [lazyParams, query.isFetching, query.isLoading]);

  /* ---------------- STATUS MUTATION ---------------- */

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; is_active: boolean }) =>
      cityApi.update(payload.id, { is_active: payload.is_active }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.cities,
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

  /* ---------------- DELETE MUTATION ---------------- */

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cityApi.remove(id),

    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.cities,
      });
    },

    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    },
  });

  /* ---------------- DATA ---------------- */

  const cities = useMemo<CityRecord[]>(() => {
    const results = query.data?.results ?? [];
    return [...results].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [query.data]);

  const totalRecords = query.data?.count ?? 0;
  const loading = query.isLoading || query.isFetching;

  /* ---------------- HANDLERS ---------------- */

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This city will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    deleteMutation.mutate(id);
  };

  /* ---------------- TEMPLATES ---------------- */

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (row: CityRecord) => (
    <Switch
      checked={row.is_active}
      disabled={isUpdatingStatus}
      onCheckedChange={(value) =>
        statusMutation.mutate({
          id: row.unique_id,
          is_active: value,
        })
      }
    />
  );

  const actionTemplate = (row: CityRecord) => (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        onClick={() => handleDelete(row.unique_id)}
        className="text-red-600 hover:text-red-800"
      >
        <i className="pi pi-trash" />
      </button>
    </div>
  );

  const indexTemplate = (_: CityRecord, { rowIndex }: any) =>
    (displayedLazyParams.page - 1) * displayedLazyParams.rows + rowIndex + 1;

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Cities..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* ---------------- RENDER ---------------- */

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Cities</h1>
          <p className="text-gray-500 text-sm">
            Manage city records
          </p>
        </div>

        <Button
          label="Add City"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={cities}
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
        emptyMessage="No cities found."
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
          field="district_name"
          header="District"
          body={(r) => cap(r.district_name)}
          sortable
        />

        <Column
          field="name"
          header="City"
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
