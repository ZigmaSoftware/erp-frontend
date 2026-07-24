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
import { nocDocumentApi, approvalNocDocumentApi } from "@/helpers/admin";
import type { NocDocument } from "../types/salesService.types";

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

export default function NocVerificationList() {
  const [documents, setDocuments] = useState<NocDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    document_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const { encSalesService, encNocVerification } = getEncryptedRoute();

  const fetchDocuments = async () => {
    try {
      const res = (await nocDocumentApi.list()) as NocDocument[];
      setDocuments(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAction = async (
    endpoint: string,
    unique_id: string,
    label: string
  ) => {
    const remarks = await showRemarksDialog(`${label} NOC Document`);
    if (!remarks) return;

    try {
      await approvalNocDocumentApi.action(endpoint, { unique_id, remarks });
      Swal.fire({ icon: "success", title: `${label} successfully!`, timer: 1500, showConfirmButton: false });
      fetchDocuments();
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

  const indexTemplate = (_: NocDocument, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: NocDocument) => (
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
    </div>
  );

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search NOC documents..."
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
            NOC Document Verification
          </h1>
          <p className="text-gray-500 text-sm">
            Review and approve pending NOC documents
          </p>
        </div>
      </div>

      <DataTable
        value={documents}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["document_name", "approve_status", "overall_approve_status"]}
        header={header}
        emptyMessage="No pending NOC documents found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          header="Customer"
          body={(row: NocDocument) => row.scrap_customer_id || "-"}
          sortable
          sortField="scrap_customer_id"
          style={{ minWidth: "140px" }}
        />
        <Column
          header="Site"
          body={(row: NocDocument) => row.site_id || "-"}
          sortable
          sortField="site_id"
          style={{ minWidth: "140px" }}
        />
        <Column field="document_name" header="Document Type" sortable style={{ minWidth: "160px" }} />
        <Column field="approve_status" header="Approve Status" sortable style={{ width: "140px" }} />
        <Column field="overall_approve_status" header="Overall Status" sortable style={{ width: "140px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "200px" }} />
      </DataTable>
    </div>
  );
}
