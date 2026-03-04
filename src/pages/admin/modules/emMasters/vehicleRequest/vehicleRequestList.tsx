import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { vehicleRequestApi, userCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { useSitesQuery, useVehicleRequestsQuery } from "@/tanstack/admin";

type RequestItem = Record<string, unknown>;

type VehicleRequestRecord = {
  unique_id: string;
  description: string;
  site_id: string;
  staff_id: string;
  site_name: string;
  staff_name: string;
  request_status: string;
  items: RequestItem[];
  created_at?: string;
};

type TableFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
};

const normalizeRequest = (
  payload: Record<string, unknown>,
  siteLookup: Map<string, string>,
  staffLookup: Map<string, string>
): VehicleRequestRecord => {
  const siteRecord = asRecord(payload["site"]);
  const staffRecord = asRecord(payload["staff"]);

  const unique_id = pickFirstString(
    payload["unique_id"],
    payload["id"],
    payload["request_id"],
    payload["request_uuid"]
  );

  const siteId = pickFirstString(
    payload["site_id"],
    siteRecord?.["unique_id"],
    siteRecord?.["id"],
    payload["site"]
  );

  const staffId = pickFirstString(
    payload["staff_id"],
    staffRecord?.["unique_id"],
    staffRecord?.["id"],
    payload["staff"]
  );

  const siteName = pickFirstString(
    payload["site_name"],
    siteRecord?.["site_name"],
    siteRecord?.["name"],
    siteLookup.get(siteId)
  );

  const staffName = pickFirstString(
    payload["staff_name"],
    staffRecord?.["full_name"],
    staffRecord?.["name"],
    staffRecord?.["username"],
    staffLookup.get(staffId)
  );

  const items =
    asArray(payload["items"]).length > 0
      ? asArray(payload["items"])
      : asArray(payload["request_items"]).length > 0
      ? asArray(payload["request_items"])
      : asArray(payload["items_data"]);

  const created_at = pickFirstString(
    payload["created_at"],
    payload["created_on"],
    payload["requested_at"],
    payload["timestamp"]
  );

  return {
    unique_id,
    description: pickFirstString(payload["description"]) ?? "",
    request_status: pickFirstString(payload["request_status"], payload["status"]),
    site_id: siteId,
    staff_id: staffId,
    site_name: siteName,
    staff_name: staffName,
    items: items as RequestItem[],
    created_at,
  };
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return undefined;
};

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const candidate = toStringValue(value);
    if (candidate !== undefined) return candidate;
  }
  return "";
};

function VehicleRequestList() {
  const [filters, setFilters] = useState<TableFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { encEmMasters, encVehicleRequest } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encVehicleRequest}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encVehicleRequest}/${id}/edit`;

  const requestsQuery = useVehicleRequestsQuery();
  const sitesQuery = useSitesQuery();
  const staffQuery = useQuery({
    queryKey: ["admin", "user-creations", "staff-list"],
    queryFn: () => userCreationApi.list(),
  });

  const siteMap = new Map<string, string>();
  (sitesQuery.data ?? [])
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .forEach((item) => {
      const id = pickFirstString(item["unique_id"], item["id"]);
      const label = pickFirstString(
        item["site_name"],
        item["name"],
        item["siteName"],
        item["display_name"]
      );
      if (id && label) siteMap.set(id, label);
    });

  const staffMap = new Map<string, string>();
  (staffQuery.data ?? [])
    .map(asRecord)
    .filter((maybeUser): maybeUser is Record<string, unknown> => {
      if (!maybeUser) return false;
      return Boolean(maybeUser["is_staff"]);
    })
    .forEach((user) => {
      const id = pickFirstString(user["unique_id"], user["id"], user["user_id"]);
      const label = pickFirstString(
        user["first_name"],
        user["last_name"],
        user["username"],
        user["email"]
      );
      if (id && label) staffMap.set(id, label);
    });

  const normalizedRequests = (requestsQuery.data ?? [])
    .map((item) => normalizeRequest(asRecord(item) ?? {}, siteMap, staffMap))
    .filter((item) => item.unique_id);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleRequestApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vehicleRequests });
      Swal.fire({ icon: "success", title: "Request deleted", timer: 1200 });
    },
    onError: () => {
      Swal.fire("Error", "Failed to delete request", "error");
    },
  });

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This request will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  const actionTemplate = (row: VehicleRequestRecord) => (
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

  const header = (
    <div className="flex flex-wrap gap-3 justify-between items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search vehicle requests..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
      <Button
        label="Add Request"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={() => navigate(ENC_NEW_PATH)}
      />
    </div>
  );

  const requests = normalizedRequests;
  const loading =
    requestsQuery.isLoading ||
    requestsQuery.isFetching ||
    requestsQuery.isRefetching ||
    sitesQuery.isLoading ||
    sitesQuery.isFetching ||
    staffQuery.isLoading ||
    staffQuery.isFetching;

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Requests</h1>
          <p className="text-gray-500 text-sm">Track pending vehicle support requests</p>
        </div>
      </div>

      <DataTable
        value={requests}
        dataKey="unique_id"
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        globalFilterFields={["site_name", "staff_name", "request_status", "description"]}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No vehicle requests found"
      >
        <Column header="S.No" body={(_, { rowIndex }) => rowIndex + 1} />
        <Column field="unique_id" header="Request ID" />
        <Column field="site_name" header="Site" sortable />
        <Column header="Items" body={(row: VehicleRequestRecord) => row.items.length} />
        <Column field="request_status" header="Status" sortable />
        <Column header="Requested On" body={(row: VehicleRequestRecord) => formatDate(row.created_at)} />
        <Column field="description" header="Description" />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}

export default VehicleRequestList;
