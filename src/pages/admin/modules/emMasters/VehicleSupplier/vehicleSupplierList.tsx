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
import { getEncryptedRoute } from "@/utils/routeCache";
import { Switch } from "@/components/ui/switch";
import { vehicleSupplierApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type {
  RawVehicleSupplierListRecord,
  VehicleSupplierTableRow,
} from "@/types/emMasters/lists";
import { useVehicleSuppliersQuery } from "@/tanstack/admin";

const vehicleSupplierListQueryKey = [
  ...masterQueryKeys.vehicleSuppliers,
  "list",
] as const;

const toBoolean = (
  value: RawVehicleSupplierListRecord["is_active"]
): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
};

const normalizeSupplier = (
  item: RawVehicleSupplierListRecord
): VehicleSupplierTableRow | null => {
  const id = item.unique_id ?? item.id;
  if (id == null) return null;

  return {
    unique_id: String(id),
    supplier_name: item.supplier_name ?? "",
    proprietor_name: item.proprietor_name ?? "",
    mobile_no: item.mobile_no ?? "",
    gst_type: item.gst_type ?? "",
    transport_medium: item.transport_medium ?? "",
    image: item.image ?? "",
    is_active: toBoolean(item.is_active),
  };
};

export default function VehicleSupplierList() {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
    supplier_name: {
      value: null as string | null,
      matchMode: FilterMatchMode.STARTS_WITH,
    },
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { encEmMasters, encVehicleSupplier } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encVehicleSupplier}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encVehicleSupplier}/${id}/edit`;

  const query = useVehicleSuppliersQuery();
  const suppliers = (query.data ?? [])
    .map((item) => normalizeSupplier(item as RawVehicleSupplierListRecord))
    .filter((item): item is VehicleSupplierTableRow => item !== null);

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      vehicleSupplierApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vehicleSuppliers });
    },
    onError: () => {
      Swal.fire("Error", "Status update failed", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleSupplierApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vehicleSuppliers });
      Swal.fire({
        icon: "success",
        title: "Deleted successfully!",
        timer: 1200,
        showConfirmButton: false,
      });
    },
    onError: () => {
      Swal.fire("Error", "Delete failed", "error");
    },
  });

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This vehicle supplier will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const statusTemplate = (row: VehicleSupplierTableRow) => (
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

  const actionTemplate = (row: VehicleSupplierTableRow) => (
    <div className="flex gap-2 justify-center">
      <button onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}>
        <PencilIcon className="size-5 text-blue-600" />
      </button>
      <button onClick={() => handleDelete(row.unique_id)}>
        <TrashBinIcon className="size-5 text-red-600" />
      </button>
    </div>
  );

  const onGlobalFilterChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const loading = query.isLoading || query.isFetching;

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-2 border px-3 py-1 rounded">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search suppliers..."
          className="p-inputtext-sm !border-0"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Suppliers</h1>
          <p className="text-sm text-gray-500">Manage vehicle suppliers</p>
        </div>

        <Button
          label="Add Supplier"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={suppliers}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        globalFilterFields={["supplier_name", "proprietor_name", "mobile_no"]}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No suppliers found"
      >
        <Column header="S.No" body={(_, { rowIndex }) => rowIndex + 1} />
        <Column
          header="Image"
          body={(row: VehicleSupplierTableRow) =>
            row.image ? (
              <img src={row.image} className="h-10 w-10 rounded object-cover" />
            ) : (
              <span className="text-xs text-gray-400">N/A</span>
            )
          }
        />
        <Column field="supplier_name" header="Supplier Name" sortable />
        <Column field="proprietor_name" header="Proprietor" sortable />
        <Column field="mobile_no" header="Mobile" />
        <Column field="transport_medium" header="Transport" />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
