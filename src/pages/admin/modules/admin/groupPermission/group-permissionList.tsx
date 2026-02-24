import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { groupPermissionApi } from "@/helpers/admin";
import type { GroupPermission } from "../types/admin.types";

type TableFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
  group_name: { value: string | null; matchMode: FilterMatchMode };
};

const normalizeList = (payload: unknown): GroupPermission[] => {
  if (Array.isArray(payload)) {
    return payload as GroupPermission[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: GroupPermission[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: { results?: unknown } }).data &&
    Array.isArray((payload as { data?: { results?: unknown[] } }).data?.results)
  ) {
    return (payload as { data: { results: GroupPermission[] } }).data.results;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "results" in payload &&
    Array.isArray((payload as { results?: unknown[] }).results)
  ) {
    return (payload as { results: GroupPermission[] }).results;
  }

  return [];
};

export default function GroupPermissionList() {
  const [records, setRecords] = useState<GroupPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<TableFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    group_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();
  const { encAdmins, encGroupPermission } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encGroupPermission}/new`;
  const ENC_EDIT_PATH = (id: string | number) =>
    `/${encAdmins}/${encGroupPermission}/${id}/edit`;

  const fetchGroupPermissions = async () => {
    try {
      const res = await groupPermissionApi.list();
      setRecords(normalizeList(res));
    } catch (error) {
      console.error("Failed to load group permissions", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupPermissions();
  }, []);

  const onGlobalFilterChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters((prev) => ({
      ...prev,
      global: { ...prev.global, value },
    }));
  };

  const indexTemplate = (_: GroupPermission, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const permissionIdsTemplate = (row: GroupPermission) =>
    row.permission_ids?.length
      ? row.permission_ids.join(", ")
      : "—";

  const actionTemplate = (row: GroupPermission) => {
    const rowId = row.id ?? row.group_id;
    return (
      <div className="flex gap-2 justify-center">
        <button
          title="Edit"
          className="text-blue-600 hover:text-blue-800"
          onClick={() => navigate(ENC_EDIT_PATH(rowId))}
        >
          <PencilIcon className="size-5" />
        </button>
      </div>
    );
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search group permissions..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Group Permission
          </h1>
          <p className="text-gray-500 text-sm">
            Manage group to permission mapping
          </p>
        </div>

        <Button
          label="Add Group Permission"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={records}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["group_name", "group_id"]}
        header={header}
        emptyMessage="No group permissions found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="group_id" header="Group ID" sortable style={{ width: "140px" }} />
        <Column field="group_name" header="Group Name" sortable style={{ minWidth: "220px" }} />
        <Column header="Permission IDs" body={permissionIdsTemplate} style={{ minWidth: "260px" }} />
        <Column header="Actions" body={actionTemplate} style={{ width: "150px" }} />
      </DataTable>
    </div>
  );
}
