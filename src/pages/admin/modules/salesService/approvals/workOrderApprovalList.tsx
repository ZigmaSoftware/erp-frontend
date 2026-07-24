import { useEffect, useState, type ChangeEvent } from "react";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { getEncryptedRoute } from "@/utils/routeCache";
import { workOrderApi, approvalWorkOrderApi } from "@/helpers/admin";
import type { WorkOrder } from "../types/salesService.types";

const statusLabel = (code: string) => {
  switch (code) {
    case "0": return "Pending";
    case "1": return "Approved";
    case "2": return "Rejected";
    default: return code || "-";
  }
};

const showRemarksDialog = async (title: string): Promise<string | null> => {
  const { value } = await Swal.fire({
    title,
    input: "text",
    inputLabel: "Remarks",
    inputPlaceholder: "Enter remarks",
    showCancelButton: true,
    inputValidator: (v) => (!v ? "Remarks are required" : undefined),
  });
  return value ?? null;
};

export default function WorkOrderApprovalList() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    workorderno: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const { encSalesService, encWorkOrderApproval } = getEncryptedRoute();

  const fetchOrders = async () => {
    try {
      const res = (await workOrderApi.list()) as WorkOrder[];
      setOrders(res.filter((o) => o.work_order_dtc_appr_status === "0"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (
    api: typeof approvalWorkOrderApi,
    endpoint: string,
    unique_id: string,
    label: string
  ) => {
    const remarks = await showRemarksDialog(`${label} Work Order`);
    if (!remarks) return;

    try {
      await api.action(endpoint, { entity_unique_id: unique_id, remarks });
      Swal.fire({ icon: "success", title: `${label} successfully!`, timer: 1500, showConfirmButton: false });
      fetchOrders();
    } catch {
      Swal.fire({ icon: "error", title: "Action failed", text: "Something went wrong." });
    }
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: WorkOrder, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: WorkOrder) => (
    <div className="flex gap-1 flex-wrap">
      <Button
        label="DTC Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction(approvalWorkOrderApi, "dtc-approve/", row.unique_id, "DTC Approved")}
      />
      <Button
        label="GM Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction(approvalWorkOrderApi, "gm-approve/", row.unique_id, "GM Approved")}
      />
      <Button
        label="Director Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction(approvalWorkOrderApi, "director-approve/", row.unique_id, "Director Approved")}
      />
      <Button
        label="Send"
        className="p-button-info p-button-sm"
        onClick={() => handleAction(approvalWorkOrderApi, "send/", row.unique_id, "Sent")}
      />
    </div>
  );

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search work orders..."
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
            Transport Work Order Approval
          </h1>
          <p className="text-gray-500 text-sm">
            Review and approve pending work orders
          </p>
        </div>
      </div>

      <DataTable
        value={orders}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["workorderno", "suppliername", "site_name"]}
        header={header}
        emptyMessage="No pending work orders found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="workorderno" header="Work Order No" sortable style={{ minWidth: "160px" }} />
        <Column field="suppliername" header="Supplier" sortable style={{ minWidth: "180px" }} />
        <Column field="site_name" header="Site" sortable style={{ minWidth: "140px" }} />
        <Column field="entry_date" header="Entry Date" sortable style={{ minWidth: "130px" }} />
        <Column header="DTC Status" body={(row: WorkOrder) => statusLabel(row.work_order_dtc_appr_status)} style={{ width: "120px" }} />
        <Column header="GM Status" body={(row: WorkOrder) => statusLabel(row.work_order_appr_status)} style={{ width: "120px" }} />
        <Column header="Director Status" body={(row: WorkOrder) => statusLabel(row.work_order_dt_appr_status)} style={{ width: "130px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "320px" }} />
      </DataTable>
    </div>
  );
}
