import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { PencilIcon } from "@/icons";
import { Switch } from "@/components/ui/switch";
import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentModelApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type {
  EquipmentModelTableRow,
  RawEquipmentModelListRecord,
} from "@/types/emMasters/lists";
import { useEquipmentModelsQuery } from "@/tanstack/admin";

const equipmentModelListQueryKey = [
  ...masterQueryKeys.equipmentModels,
  "list",
] as const;

const toBoolean = (value: RawEquipmentModelListRecord["is_active"]): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
};

const normalizeEquipmentModel = (
  item: RawEquipmentModelListRecord
): EquipmentModelTableRow | null => {
  const id = item.unique_id ?? item.id;
  if (id == null) return null;

  const equipmentType =
    item.equipment_type_name ??
    (typeof item.equipment_type === "object" && item.equipment_type
      ? item.equipment_type.name ?? ""
      : "");

  return {
    unique_id: String(id),
    equipment_type: equipmentType,
    manufacturer: item.manufacturer ?? "",
    model_name: item.model_name ?? "",
    description: item.description ?? "",
    is_active: toBoolean(item.is_active),
  };
};

export default function EquipmentModelList() {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: {
      value: null as string | null,
      matchMode: FilterMatchMode.CONTAINS,
    },
    model_name: {
      value: null as string | null,
      matchMode: FilterMatchMode.STARTS_WITH,
    },
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { encEmMasters, encEquipmentModel } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encEquipmentModel}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encEquipmentModel}/${id}/edit`;

  const query = useEquipmentModelsQuery();
  const normalizedModels = (query.data ?? [])
    .map((item) => normalizeEquipmentModel(item as RawEquipmentModelListRecord))
    .filter((item): item is EquipmentModelTableRow => item !== null);

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      equipmentModelApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.equipmentModels,
      });
    },
    onError: () => {
      Swal.fire("Error", "Status update failed", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => equipmentModelApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.equipmentModels,
      });
      Swal.fire({
        icon: "success",
        title: "Deleted!",
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
      text: "This equipment model will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const statusTemplate = (row: EquipmentModelTableRow) => (
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

  const actionTemplate = (row: EquipmentModelTableRow) => (
    <div className="flex gap-2 justify-center">
      <button onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}>
        <PencilIcon className="size-5 text-blue-600" />
      </button>
      {/* <button onClick={() => handleDelete(row.unique_id)}>
        <TrashBinIcon className="size-5 text-red-600" />
      </button> */}
    </div>
  );

  const onGlobalFilterChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
  };

  const models = normalizedModels;
  const loading = query.isLoading || query.isFetching;

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipment Models</h1>
          <p className="text-gray-500 text-sm">Manage equipment models</p>
        </div>

        <Button
          label="Add Equipment Model"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={models}
        loading={loading}
        paginator
        rows={10}
        filters={filters}
        globalFilterFields={["model_name", "manufacturer", "equipment_type"]}
        header={
          <div className="flex justify-end">
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search models..."
            />
          </div>
        }
        stripedRows
        showGridlines
      >
        <Column header="S.No" body={(_, { rowIndex }) => rowIndex + 1} />
        <Column field="equipment_type" header="Equipment Type" sortable />
        <Column field="manufacturer" header="Manufacturer" sortable />
        <Column field="model_name" header="Model Name" sortable />
        <Column field="description" header="Description" />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
