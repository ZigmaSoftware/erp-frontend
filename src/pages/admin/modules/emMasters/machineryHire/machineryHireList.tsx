import { useEffect, useState } from "react";
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

import { PencilIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { Switch } from "@/components/ui/switch";
import { machineryHireApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { MachineryHireRecord } from "@/types/tanstack/masters";
import type { MachineryHireTableRow } from "@/types/emMasters/lists";
import { useMachineryHiresQuery } from "@/tanstack/admin";

const toBoolean = (
  value: boolean | string | number | null | undefined
): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }
  return undefined;
};

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const candidate = toStringValue(value);
    if (candidate !== undefined) return candidate;
  }
  return "";
};

const normalizeMachineryHireRecord = (
  item: MachineryHireRecord
): MachineryHireTableRow | null => {
  const uniqueId = pickFirstString(item.unique_id, (item as Record<string, unknown>)["id"]);
  if (!uniqueId) return null;

  const numericId = Number((item as Record<string, unknown>)["id"] ?? item.unique_id);

  return {
    id: Number.isNaN(numericId) ? 0 : numericId,
    unique_id: uniqueId,
    site_id: pickFirstString(item.site_id),
    site_name: pickFirstString(item.site_name),
    equipment_type_id: pickFirstString(item.equipment_type_id),
    equipment_type_name: pickFirstString(item.equipment_type_name),
    equipment_model_id: pickFirstString(item.equipment_model_id),
    equipment_model_name: pickFirstString(item.equipment_model_name),
    vehicle_id: pickFirstString(item.vehicle_id),
    vehicle_code: pickFirstString(item.vehicle_code),
    date: pickFirstString(item.date),
    diesel_status: pickFirstString(item.diesel_status),
    hire_rate: pickFirstString(item.hire_rate),
    unit: pickFirstString(item.unit),
    is_active: toBoolean(item.is_active),
    is_deleted: toBoolean(item.is_deleted),
  };
};

export default function MachineryHireList() {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();
  const { encEmMasters, encMachineryHire } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encMachineryHire}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encMachineryHire}/${id}/edit`;
  const queryClient = useQueryClient();
  const query = useMachineryHiresQuery();

  const normalizedRecords = (query.data ?? [])
    .map(normalizeMachineryHireRecord)
    .filter((item): item is MachineryHireTableRow => Boolean(item && item.unique_id));

  const loading = query.isLoading || query.isFetching || query.isRefetching;

  useEffect(() => {
    if (!query.error) return;

    Swal.fire("Error", "Failed to load machinery hire records", "error");
  }, [query.error]);

  const handleDelete = async (unique_id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    await machineryHireApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    queryClient.invalidateQueries({ queryKey: masterQueryKeys.machineryHires });
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: MachineryHireTableRow, { rowIndex }: any) =>
    rowIndex + 1;

  const statusTemplate = (row: MachineryHireTableRow) => {
    const updateStatus = async (value: boolean) => {
      await machineryHireApi.update(row.unique_id, {
        is_active: value,
      });

      queryClient.invalidateQueries({ queryKey: masterQueryKeys.machineryHires });
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: MachineryHireTableRow) => (
    <div className="flex gap-2 justify-center">
      <button
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search machinery hire..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Machinery Hire
          </h1>
          <p className="text-gray-500 text-sm">
            Manage machinery hire records
          </p>
        </div>

        <Button
          label="Add Machinery Hire"
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
        globalFilterFields={[
          "site_name",
          "equipment_type_name",
          "equipment_model_name",
          "vehicle_code",
        ]}
        header={header}
        emptyMessage="No records found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="site_name" header="Site" sortable />
        <Column field="equipment_type_name" header="Type" sortable />
        <Column field="equipment_model_name" header="Model" sortable />
        <Column field="vehicle_code" header="Vehicle Code" sortable />
        <Column field="date" header="Date" sortable />
        <Column field="diesel_status" header="Diesel Status" sortable />
        <Column field="hire_rate" header="Hire Rate" sortable />
        <Column field="unit" header="Unit" sortable />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
