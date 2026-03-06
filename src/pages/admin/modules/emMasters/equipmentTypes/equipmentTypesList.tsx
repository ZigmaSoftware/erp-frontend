import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";

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
import { equipmentTypeApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { EquipmentTypeTableRow } from "@/types/emMasters/lists";
import { useEquipmentTypesQuery } from "@/tanstack/admin";

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return "";
};

export default function EquipmentTypeList() {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encEmMasters, encEquipmentType } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encEquipmentType}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encEmMasters}/${encEquipmentType}/${unique_id}/edit`;

  const queryClient = useQueryClient();
  const query = useEquipmentTypesQuery();

  const normalizeEquipmentType = (item: unknown): EquipmentTypeTableRow => {
    const payload =
      item && typeof item === "object" && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : {};

    const statusFromIsActive = payload["is_active"];
    const statusFromStatus = payload["status"];
    const derivedStatus =
      statusFromIsActive !== undefined && statusFromIsActive !== null
        ? toBoolean(statusFromIsActive)
        : toBoolean(statusFromStatus);

    return {
      unique_id: toStringValue(payload["unique_id"] ?? payload["id"]),
      name: toStringValue(
        payload["name"] ??
          payload["equipment_type_name"] ??
          payload["equipmenttype_name"]
      ),
      description: toStringValue(payload["description"] ?? payload["remarks"]),
      category: toStringValue(payload["category"] ?? payload["category_name"]),
      image: toStringValue(payload["image"] ?? payload["image_url"]),
      is_active: derivedStatus,
    };
  };

  const normalizedRecords = (query.data ?? [])
    .map(normalizeEquipmentType)
    .filter((item): item is EquipmentTypeTableRow => Boolean(item.unique_id));

  const loading = query.isLoading || query.isFetching || query.isRefetching;

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This equipment type will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await equipmentTypeApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    queryClient.invalidateQueries({ queryKey: masterQueryKeys.equipmentTypes });
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (
    _: EquipmentTypeTableRow,
    { rowIndex }: { rowIndex: number }
  ) => rowIndex + 1;

  const actionTemplate = (row: EquipmentTypeTableRow) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const statusTemplate = (row: EquipmentTypeTableRow) => {
    const updateStatus = async (value: boolean) => {
      await equipmentTypeApi.update(row.unique_id, {
        name: row.name,
        equipment_type_name: row.name,
        description: row.description,
        category: row.category,
        is_active: value,
      });

      queryClient.invalidateQueries({ queryKey: masterQueryKeys.equipmentTypes });
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search equipment types..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Equipment Types
          </h1>
          <p className="text-gray-500 text-sm">
            Manage equipment type records
          </p>
        </div>

        <Button
          label="Add Equipment Type"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={normalizedRecords}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["name", "description", "category"]}
        header={header}
        emptyMessage="No equipment types found."
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
          field="image"
          header="Image"
          body={(row: EquipmentTypeTableRow) =>
            row.image ? (
              <img
                src={row.image}
                alt={row.name}
                className="h-10 w-10 rounded object-cover border"
              />
            ) : (
              <span className="text-gray-400 text-xs">N/A</span>
            )
          }
          style={{ width: "120px" }}
        />
        <Column
          field="name"
          header="Equipment Type"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="description"
          header="Description"
          sortable
          style={{ minWidth: "240px" }}
        />
        <Column
          field="category"
          header="Category"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px" }}
        />
        <Column
          header="Actions"
          body={actionTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );
}
