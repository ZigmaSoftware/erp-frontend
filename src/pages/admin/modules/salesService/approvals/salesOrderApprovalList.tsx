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
import { salesOrderApi, approvalSalesOrderApi } from "@/helpers/admin";
import type { SalesOrder } from "../types/salesService.types";

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

export default function SalesOrderApprovalList() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    work_no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const { encSalesService, encSalesOrderApproval } = getEncryptedRoute();

  const fetchOrders = async () => {
    try {
      const res = (await salesOrderApi.list()) as SalesOrder[];
      setOrders(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (
    endpoint: string,
    unique_id: string,
    label: string
  ) => {
    const remarks = await showRemarksDialog(`${label} Sales Order`);
    if (!remarks) return;

    try {
      await approvalSalesOrderApi.action(endpoint, { unique_id, remarks });
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

  const indexTemplate = (_: SalesOrder, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: SalesOrder) => (
    <div className="flex gap-1 flex-wrap">
      <Button
        label="Site Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction("site-approve/", row.unique_id, "Site Approved")}
      />
      <Button
        label="Dept Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction("dept-approve/", row.unique_id, "Dept Approved")}
      />
      <Button
        label="Acc Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction("acc-approve/", row.unique_id, "Acc Approved")}
      />
      <Button
        label="Reject"
        className="p-button-danger p-button-sm"
        onClick={() => handleAction("reject/", row.unique_id, "Rejected")}
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
          placeholder="Search sales orders..."
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
            Sales Order Approval
          </h1>
          <p className="text-gray-500 text-sm">
            Review and approve pending sales orders
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
        globalFilterFields={["work_no", "customer_name", "site_name"]}
        header={header}
        emptyMessage="No pending sales orders found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="work_no" header="Work No" sortable style={{ minWidth: "140px" }} />
        <Column field="customer_name" header="Customer" sortable style={{ minWidth: "180px" }} />
        <Column field="site_name" header="Site" sortable style={{ minWidth: "140px" }} />
        <Column field="entry_date" header="Entry Date" sortable style={{ minWidth: "130px" }} />
        <Column field="approve_status" header="Approve Status" sortable style={{ width: "140px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "320px" }} />
      </DataTable>
    </div>
  );
}
