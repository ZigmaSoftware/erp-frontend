import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { Switch } from "@/components/ui/switch";
import { vehicleCreationApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { VehicleCreationTableRow } from "@/types/emMasters/lists";
import { useVehicleCreationsQuery } from "@/tanstack/admin";

const vehicleCreationListQueryKey = [...masterQueryKeys.vehicleCreations, "list"] as const;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return undefined;
};

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const resolved = toStringValue(value);
    if (resolved !== undefined) return resolved;
  }
  return "";
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "active";
  }
  return false;
};

const normalizeRow = (
  payload: Record<string, unknown>
): VehicleCreationTableRow => {
  const contractor = asRecord(payload["contractor_id"]);
  const supplier = asRecord(payload["supplier_id"]);
  const site = asRecord(payload["site_id"]);
  const request = asRecord(payload["request_id"]);
  const equipmentType = asRecord(payload["equipment_type_id"]);
  const equipmentModel = asRecord(payload["equipment_model_id"]);

  return {
    unique_id: pickFirstString(payload["unique_id"], payload["id"]),
    vehicle_code: pickFirstString(payload["vehicle_code"]),
    vehicle_reg_no: pickFirstString(payload["vehicle_reg_no"]),
    hire_type: pickFirstString(payload["hire_type"]),
    rental_basis: pickFirstString(payload["rental_basis"]),
    request_no: pickFirstString(
      payload["request_no"],
      request?.["request_no"],
      request?.["request_id"],
    ),
    site_name: pickFirstString(payload["site_name"], site?.["site_name"], site?.["name"]),
    equipment_type_name: pickFirstString(
      payload["equipment_type_name"],
      equipmentType?.["name"],
      equipmentType?.["equipment_type_name"],
    ),
    equipment_model_name: pickFirstString(
      payload["equipment_model_name"],
      equipmentModel?.["model_name"],
      equipmentModel?.["name"],
    ),
    contractor_name: pickFirstString(
      payload["contractor_name"],
      contractor?.["contractor_name"],
      contractor?.["name"],
    ),
    supplier_name: pickFirstString(
      payload["supplier_name"],
      supplier?.["supplier_name"],
      supplier?.["name"],
    ),
    is_active: toBoolean(payload["is_active"] ?? payload["status"]),
  };
};

export default function VehicleCreationList() {
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { encEmMasters, encVehicleCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encVehicleCreation}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encVehicleCreation}/${id}/edit`;

  const query = useVehicleCreationsQuery();
  const normalizedRows = (query.data ?? [])
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => normalizeRow(item))
    .filter((item) => item.unique_id);

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      vehicleCreationApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.vehicleCreations,
      });
    },
    onError: () => {
      Swal.fire("Error", "Failed to update vehicle status", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleCreationApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.vehicleCreations,
      });
      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    },
    onError: () => {
      Swal.fire("Error", "Failed to delete vehicle creation record", "error");
    },
  });

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This vehicle creation record will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const onGlobalFilterChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  const actionTemplate = (row: VehicleCreationTableRow) => (
    <div className="flex gap-2 justify-center">
      <button
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>
      <button
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const statusTemplate = (row: VehicleCreationTableRow) => (
    <Switch
      checked={row.is_active}
      onCheckedChange={(checked) =>
        statusMutation.mutate({
          id: row.unique_id,
          is_active: checked,
        })
      }
      disabled={statusMutation.isPending || deleteMutation.isPending}
    />
  );

  const header = (
    <div className="flex flex-wrap gap-3 justify-between items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search vehicle creations..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
      <Button
        label="Add Vehicle"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={() => navigate(ENC_NEW_PATH)}
      />
    </div>
  );

  const rows = normalizedRows;
  const loading = query.isLoading || query.isFetching;

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Creation</h1>
          <p className="text-gray-500 text-sm">Manage created vehicle records</p>
        </div>
      </div>

      <DataTable
        value={rows}
        dataKey="unique_id"
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        globalFilterFields={[
          "vehicle_code",
          "vehicle_reg_no",
          "hire_type",
          "request_no",
          "site_name",
          "equipment_type_name",
          "equipment_model_name",
          "contractor_name",
          "supplier_name",
          "rental_basis",
        ]}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No vehicle creation records found"
      >
        <Column header="S.No" body={(_, options) => options.rowIndex + 1} />
        <Column field="vehicle_code" header="Vehicle Code" sortable />
        <Column field="vehicle_reg_no" header="Reg No" sortable />
        <Column field="hire_type" header="Hire Type" sortable />
        <Column field="request_no" header="Request No" sortable />
        <Column field="site_name" header="Site" sortable />
        <Column field="equipment_type_name" header="Equipment Type" sortable />
        <Column field="equipment_model_name" header="Equipment Model" sortable />
        <Column
          field="contractor_name"
          header="Contractor"
          sortable
          body={(row: VehicleCreationTableRow) => row.contractor_name || "—"}
        />
        <Column
          field="supplier_name"
          header="Supplier"
          sortable
          body={(row: VehicleCreationTableRow) => row.supplier_name || "—"}
        />
        <Column header="Status" body={statusTemplate} />
        <Column field="rental_basis" header="Rental Basis" sortable />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
