import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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

import { openDocumentPopup } from "@/utils/documentPreview";
import { DISPOSAL_TYPE_LABELS } from "@/utils/disposalTypes";
import { normalizeRelationId } from "@/utils/formHelpers";
import {
  approvalNocDocumentApi,
  customerCreationServiceApi,
  documentTypeServiceApi,
  siteApi,
} from "@/helpers/admin";
import type { NocDocument } from "../types/salesService.types";

const showRemarksDialog = async (title: string): Promise<string | null> => {
  const { value } = await Swal.fire({
    title,
    input: "text",
    inputLabel: "Remarks",
    inputPlaceholder: "Enter remarks",
    showCancelButton: true,
    inputValidator: (value) => (!value ? "Remarks are required" : undefined),
  });
  return value ?? null;
};

const displayDate = (value?: string | null) => {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : value;
};

const fileNameFromUrl = (url?: string | null) =>
  url?.split("?")[0].split("/").pop() || "document";

export default function NocVerificationList() {
  const [documents, setDocuments] = useState<NocDocument[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const customerNameById = useMemo(
    () =>
      new Map(
        customers.map((customer) => [
          normalizeRelationId(customer),
          customer.customer_name || customer.name || normalizeRelationId(customer),
        ]),
      ),
    [customers],
  );
  const siteNameById = useMemo(
    () =>
      new Map(
        sites.map((site) => [
          normalizeRelationId(site),
          site.site_name || site.name || normalizeRelationId(site),
        ]),
      ),
    [sites],
  );
  const documentTypeNameById = useMemo(
    () =>
      new Map(
        documentTypes.map((type) => [
          normalizeRelationId(type),
          type.doc_type || type.name || normalizeRelationId(type),
        ]),
      ),
    [documentTypes],
  );

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await approvalNocDocumentApi.action<NocDocument[]>(
        "verification-list",
      );
      setDocuments(Array.isArray(response) ? response : []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Unable to load NOC verification",
        text: "Only submitted NOC Upload documents are shown here.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    Promise.allSettled([
      customerCreationServiceApi.list(),
      siteApi.list(),
      documentTypeServiceApi.list(),
    ]).then(([customerResult, siteResult, documentTypeResult]) => {
      if (customerResult.status === "fulfilled") setCustomers(customerResult.value as any[]);
      if (siteResult.status === "fulfilled") setSites(siteResult.value as any[]);
      if (documentTypeResult.status === "fulfilled") setDocumentTypes(documentTypeResult.value as any[]);
    });
  }, []);

  const handleAction = async (uniqueId: string, label: "Approve" | "Reject") => {
    const remarks = await showRemarksDialog(`${label} NOC Document`);
    if (!remarks) return;

    try {
      await approvalNocDocumentApi.action(`${uniqueId}/${label.toLowerCase()}/`, {
        remarks,
      });
      Swal.fire({
        icon: "success",
        title: `${label === "Approve" ? "Approved" : "Rejected"} successfully!`,
        timer: 1500,
        showConfirmButton: false,
      });
      await fetchDocuments();
    } catch {
      Swal.fire({ icon: "error", title: "Action failed", text: "Something went wrong." });
    }
  };

  const onGlobalFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((previous) => ({
      ...previous,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: NocDocument, { rowIndex }: { rowIndex: number }) => rowIndex + 1;

  const documentTypeTemplate = (row: NocDocument) =>
    documentTypeNameById.get(normalizeRelationId(row.noc_doc_type_id)) || row.document_name || "-";

  const documentTemplate = (row: NocDocument) => {
    if (!row.document_file) return "-";
    const name = row.document_name || fileNameFromUrl(row.document_file);
    const isImage = /\.(jpe?g|png|webp)$/i.test(name) || /\.(jpe?g|png|webp)(\?|$)/i.test(row.document_file);
    return isImage ? (
      <img src={row.document_file} alt={name} className="h-9 w-12 rounded border object-cover" />
    ) : (
      <i className={/\.pdf$/i.test(name) ? "pi pi-file-pdf text-2xl text-red-600" : "pi pi-file text-2xl text-gray-600"} />
    );
  };

  const viewTemplate = (row: NocDocument) => {
    if (!row.document_file) return "-";
    const name = row.document_name || fileNameFromUrl(row.document_file);
    return (
      <button
        type="button"
        title="View document"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => openDocumentPopup(row.document_file as string, name, "")}
      >
        <i className="pi pi-eye text-lg" />
      </button>
    );
  };

  const actionTemplate = (row: NocDocument) =>
    row.approve_status === "Pending" ? (
      <div className="flex gap-1 flex-wrap">
        <Button label="Verify" className="p-button-success p-button-sm" onClick={() => handleAction(row.unique_id, "Approve")} />
        <Button label="Reject" className="p-button-danger p-button-sm" onClick={() => handleAction(row.unique_id, "Reject")} />
      </div>
    ) : null;

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">NOC Document Verification</h1>
        <p className="text-gray-500 text-sm">Review and verify documents submitted from NOC Upload</p>
      </div>

      <DataTable
        value={documents}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={[
          "document_name",
          "customer_name",
          "site_name",
          "customer_destination",
          "dispose_type",
          "approve_status",
          "overall_approve_status",
        ]}
        header={header}
        emptyMessage="No submitted NOC documents found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "70px" }} />
        <Column header="Date" body={(row: NocDocument) => displayDate(row.entry_date)} sortable sortField="entry_date" />
        <Column header="Customer Name" body={(row: NocDocument) => row.customer_name || customerNameById.get(normalizeRelationId(row.scrap_customer_id)) || normalizeRelationId(row.scrap_customer_id) || "-"} sortable sortField="scrap_customer_id" style={{ minWidth: "180px" }} />
        <Column header="Site Name" body={(row: NocDocument) => row.site_name || siteNameById.get(normalizeRelationId(row.site_id)) || normalizeRelationId(row.site_id) || "-"} sortable sortField="site_id" style={{ minWidth: "160px" }} />
        <Column field="customer_destination" header="Customer Destination" sortable style={{ minWidth: "180px" }} />
        <Column header="Disposal Type" body={(row: NocDocument) => DISPOSAL_TYPE_LABELS[row.dispose_type] || row.dispose_type || "-"} sortable sortField="dispose_type" />
        <Column header="Document Type" body={documentTypeTemplate} sortable sortField="noc_doc_type_id" style={{ minWidth: "160px" }} />
        <Column header="Document" body={documentTemplate} style={{ width: "100px", textAlign: "center" }} />
        <Column header="Uploaded By" body={(row: NocDocument) => row.staff_id || row.created_by || "-"} sortable sortField="created_by" />
        <Column header="Verified Staff Name" body={(row: NocDocument) => row.approve_staff_name || row.approve_staff_id || "---"} sortable sortField="approve_staff_name" />
        <Column header="Verified Date" body={(row: NocDocument) => displayDate(row.approve_date)} sortable sortField="approve_date" />
        <Column field="approve_status" header="Verify Status" sortable />
        <Column field="overall_approve_status" header="Customer Verify Status" sortable />
        <Column header="View" body={viewTemplate} style={{ width: "80px", textAlign: "center" }} />
        <Column header="Action" body={actionTemplate} style={{ minWidth: "150px" }} />
      </DataTable>
    </div>
  );
}
