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
import { afrRfqApi, approvalAfrTransportApi } from "@/helpers/admin";
import type { AfrTransportRfq } from "../types/salesService.types";

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

export default function AfrTransportApprovalList() {
  const [rfqs, setRfqs] = useState<AfrTransportRfq[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    request_quotation_transportation: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const { encSalesService, encAfrTransportApproval } = getEncryptedRoute();

  const fetchRfqs = async () => {
    try {
      const res = (await afrRfqApi.list()) as AfrTransportRfq[];
      setRfqs(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleAction = async (
    endpoint: string,
    unique_id: string,
    label: string
  ) => {
    const remarks = await showRemarksDialog(`${label} AFR Transport`);
    if (!remarks) return;

    try {
      await approvalAfrTransportApi.action(endpoint, { unique_id, remarks });
      Swal.fire({ icon: "success", title: `${label} successfully!`, timer: 1500, showConfirmButton: false });
      fetchRfqs();
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

  const indexTemplate = (_: AfrTransportRfq, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: AfrTransportRfq) => (
    <div className="flex gap-1 flex-wrap">
      <Button
        label="Approve"
        className="p-button-success p-button-sm"
        onClick={() => handleAction("approve/", row.unique_id, "Approved")}
      />
      <Button
        label="Reject"
        className="p-button-danger p-button-sm"
        onClick={() => handleAction("reject/", row.unique_id, "Rejected")}
      />
      <Button
        label="Revert"
        className="p-button-warning p-button-sm"
        onClick={() => handleAction("revert/", row.unique_id, "Reverted")}
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
          placeholder="Search AFR transports..."
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
            AFR Transport Approval
          </h1>
          <p className="text-gray-500 text-sm">
            Review and approve pending AFR transport RFQs
          </p>
        </div>
      </div>

      <DataTable
        value={rfqs}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["request_quotation_transportation", "source", "destination"]}
        header={header}
        emptyMessage="No pending AFR transports found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          field="request_quotation_transportation"
          header="Transport Type"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column field="source" header="Source" sortable style={{ minWidth: "140px" }} />
        <Column field="destination" header="Destination" sortable style={{ minWidth: "140px" }} />
        <Column field="load_type" header="Load Type" sortable style={{ width: "120px" }} />
        <Column field="due_date" header="Due Date" sortable style={{ minWidth: "130px" }} />
        <Column
          header="Status"
          body={(row: AfrTransportRfq) => (row.status ? "Active" : "Inactive")}
          style={{ width: "110px" }}
        />
        <Column header="Action" body={actionTemplate} style={{ width: "240px" }} />
      </DataTable>
    </div>
  );
}
