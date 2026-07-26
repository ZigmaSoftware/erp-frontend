import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  customerCreationServiceApi,
  customerItemPurposeServiceApi,
  documentTypeServiceApi,
  nocDocumentApi,
  siteApi,
} from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import { DISPOSAL_TYPE_LABELS } from "@/utils/disposalTypes";
import { openDocumentPopup } from "@/utils/documentPreview";
import { normalizeRelationId, pickSiteId } from "@/utils/formHelpers";
import type {
  NocDocumentUploadRow,
  NocListRow,
} from "../types/salesService.types";

type Option = { value: string; label: string };
type PendingDocument = {
  id: string;
  documentTypeId: string;
  file: File;
  previewUrl: string;
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

const displayDate = (value?: string | null) => {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : value;
};

const createPendingId = () =>
  `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function NocDocumentList() {
  const [rows, setRows] = useState<NocListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);

  const [customerFilter, setCustomerFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const [uploadRow, setUploadRow] = useState<NocListRow | null>(null);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dialogError, setDialogError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      const results = await Promise.allSettled([
        customerCreationServiceApi.list(),
        siteApi.list(),
        documentTypeServiceApi.list(),
      ]);

      const [customerResult, siteResult, documentTypeResult] = results;
      if (customerResult.status === "fulfilled") {
        setCustomers(customerResult.value as unknown[]);
      }
      if (siteResult.status === "fulfilled") {
        setSites(siteResult.value as unknown[]);
      }
      if (documentTypeResult.status === "fulfilled") {
        setDocTypes(documentTypeResult.value as unknown[]);
      }

      const failedRequests = results.filter(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (failedRequests.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Failed to load dropdown options",
          text: "Sales Service is unavailable. Start the Sales Service on port 8003, then reload this page.",
        });
      }
    };

    loadOptions();
  }, []);

  const customerOptions = useMemo(
    () =>
      toOptions(
        customers.filter((customer: any) => customer.noc_upload),
        (customer) => customer.unique_id,
        (customer) => customer.customer_name,
      ),
    [customers],
  );

  const siteOptions = useMemo(
    () => toOptions(sites, (site) => site.unique_id, (site) => site.site_name),
    [sites],
  );

  const siteNameById = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((site: any) => {
      const key = normalizeRelationId(site);
      if (key) map.set(key, site.site_name || site.name || key);
    });
    return map;
  }, [sites]);

  const customerById = useMemo(() => {
    const map = new Map<string, any>();
    customers.forEach((customer: any) => {
      const key = normalizeRelationId(customer);
      if (key) map.set(key, customer);
    });
    return map;
  }, [customers]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (customerFilter) params.customer = customerFilter;
      if (siteFilter) params.site = siteFilter;

      const response = await customerItemPurposeServiceApi.action<NocListRow[]>(
        "noc-list",
        undefined,
        { params },
      );
      setRows(Array.isArray(response) ? response : []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed to load NOC upload list",
        text: "Sales Service is unavailable. Start the Sales Service on port 8003, then reload this page.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // The initial worklist should load once; GO handles later filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGlobalFilterChange = (event: any) => {
    const value = event.target.value;
    setFilters({ global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: NocListRow, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const disposalTypeTemplate = (row: NocListRow) =>
    DISPOSAL_TYPE_LABELS[row.disposal_type] ?? row.disposal_type;

  const verifyStatusTemplate = (value: string) => {
    const normalizedValue = value || "Pending";
    const displayValue =
      normalizedValue === "Approve" ? "Verified" : normalizedValue === "Reject" ? "Cancel" : normalizedValue;
    const statusClass =
      displayValue === "Verified"
        ? "bg-green-100 text-green-800"
        : displayValue === "Cancel"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
        {displayValue}
      </span>
    );
  };

  const openUploadDialog = (row: NocListRow) => {
    pendingDocuments.forEach((document) => URL.revokeObjectURL(document.previewUrl));
    setUploadRow(row);
    setSelectedDocTypeId("");
    setSelectedFiles([]);
    setPendingDocuments([]);
    setFileInputKey((key) => key + 1);
    setDialogError("");
  };

  const closeUploadDialog = () => {
    pendingDocuments.forEach((document) => URL.revokeObjectURL(document.previewUrl));
    setPendingDocuments([]);
    setUploadRow(null);
  };

  const addDocuments = () => {
    const documentTypeId = selectedDocTypeId.trim();
    if (!documentTypeId) {
      setDialogError("Document type is required.");
      return;
    }
    if (selectedFiles.length === 0) {
      setDialogError("Please choose a document.");
      return;
    }

    const invalidFile = selectedFiles.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return !extension || !ALLOWED_EXTENSIONS.includes(extension) || file.size > MAX_FILE_SIZE;
    });
    if (invalidFile) {
      const extension = invalidFile.name.split(".").pop()?.toLowerCase();
      const message =
        extension && ALLOWED_EXTENSIONS.includes(extension)
          ? "Each file must be 15 MB or smaller."
          : "Allowed extensions: .jpg, .jpeg, .png, .pdf.";
      setDialogError(message);
      return;
    }

    setPendingDocuments((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: createPendingId(),
        documentTypeId,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    setSelectedFiles([]);
    setFileInputKey((key) => key + 1);
    setDialogError("");
  };

  const handleSubmit = async () => {
    if (!uploadRow) return;
    if (pendingDocuments.length === 0) {
      setDialogError("Add at least one document before submitting.");
      return;
    }

    setUploading(true);
    try {
      await Promise.all(
        pendingDocuments.map(({ documentTypeId, file }) => {
          const formData = new FormData();
          formData.append("scrap_customer_id", uploadRow.customer_id);
          formData.append("scrap_item_purpose_id", uploadRow.item_purpose_id);
          formData.append("site_id", uploadRow.site_id);
          formData.append("noc_doc_type_id", documentTypeId);
          formData.append("dispose_type", uploadRow.disposal_type);
          formData.append("customer_destination", uploadRow.destination);
          formData.append(
            "entry_date",
            uploadRow.customer_entry_date ||
              customerById.get(uploadRow.customer_id)?.entry_date ||
              "",
          );
          formData.append("document_name", file.name);
          formData.append("document_file", file);
          return nocDocumentApi.upload(formData);
        }),
      );

      Swal.fire({
        icon: "success",
        title: "Documents submitted successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      closeUploadDialog();
      await fetchRows();
    } catch (error) {
      setDialogError(
        (error as any)?.response?.status === 503
          ? "Sales Service is unavailable. Start the Sales Service on port 8003, then reload this page."
          : extractErrorMessage(error),
      );
    } finally {
      setUploading(false);
    }
  };

  const actionTemplate = (row: NocListRow) => (
    <button
      title="NOC Upload / View"
      className="text-blue-600 hover:text-blue-800"
      onClick={() => openUploadDialog(row)}
    >
      <i className="pi pi-upload text-lg" />
    </button>
  );

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const selectedRowCustomer = uploadRow
    ? customerById.get(normalizeRelationId(uploadRow.customer_id))
    : undefined;
  const uploadDocumentTypes = uploadRow
    ? toOptions(
        docTypes.filter((documentType: any) => documentType.disposal_type === uploadRow.disposal_type),
        (documentType) => documentType.unique_id,
        (documentType) => documentType.doc_type,
      )
    : [];

  const documentTypeName = (id?: string | null) =>
    docTypes.find((documentType: any) => documentType.unique_id === id)?.doc_type ?? "-";

  const resolveSiteName = (value: unknown) => {
    const key = pickSiteId(value);
    return (key && siteNameById.get(key)) || key || "-";
  };

  return (
    <div className="px-3 py-3 w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">NOC Document Upload</h1>
        <p className="text-gray-500 text-sm">
          Upload NOC documents for each customer's destination and item
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
        <div>
          <Label>Customer Name</Label>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {customerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Site Name</Label>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {siteOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div><Button onClick={fetchRows}>GO</Button></div>
      </div>

      <DataTable
        value={rows}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["customer_name", "site_name", "destination", "item_name", "disposal_type"]}
        header={header}
        emptyMessage="No NOC upload records found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "70px" }} />
        <Column field="customer_name" header="Customer Name" sortable style={{ minWidth: "160px" }} />
        <Column header="Site Name" body={(row: NocListRow) => row.site_name || resolveSiteName(row.site_id)} sortable style={{ minWidth: "160px" }} />
        <Column field="destination" header="Destination" sortable style={{ minWidth: "160px" }} />
        <Column field="item_name" header="Item Name" sortable style={{ minWidth: "160px" }} />
        <Column header="Disposal Type" body={disposalTypeTemplate} sortable style={{ minWidth: "160px" }} />
        <Column header="Disposal Type Verify Status" body={(row: NocListRow) => verifyStatusTemplate(row.item_verification_status)} style={{ minWidth: "160px" }} />
        <Column header="Destination Approve Status" body={(row: NocListRow) => verifyStatusTemplate(row.destination_verification_status)} style={{ minWidth: "160px" }} />
        <Column header="NOC Upload / View" body={actionTemplate} style={{ width: "140px" }} />
      </DataTable>

      <Dialog open={Boolean(uploadRow)} onOpenChange={(open) => !open && closeUploadDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>NOC Upload / View</DialogTitle>
          </DialogHeader>

          {uploadRow && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 rounded-md bg-gray-50 p-4 text-sm">
                <ReadOnlyField label="Date" value={displayDate(uploadRow.customer_entry_date || selectedRowCustomer?.entry_date)} />
                <ReadOnlyField label="Site Name" value={uploadRow.site_name || resolveSiteName(uploadRow.site_id)} />
                <ReadOnlyField label="Customer Destination" value={uploadRow.destination} />
                <ReadOnlyField label="Disposal Type" value={DISPOSAL_TYPE_LABELS[uploadRow.disposal_type] ?? uploadRow.disposal_type} />
              </div>

              <div>
                <Label>Document Type *</Label>
                <select
                  value={selectedDocTypeId}
                  onChange={(event) => {
                    setSelectedDocTypeId(event.target.value);
                    setDialogError("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select document type</option>
                    {uploadDocumentTypes.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
              </div>

              <div>
                <Label>Upload Documents</Label>
                <Input
                  key={fileInputKey}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(event) => {
                    setSelectedFiles(Array.from(event.target.files ?? []));
                    setDialogError("");
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Allowed Extensions: .jpg, .jpeg, .png, .pdf. Maximum size: 15 MB per file.
                </p>
                <div className="mt-3 flex justify-end">
                  <Button type="button" onClick={addDocuments}>Add</Button>
                </div>
                {dialogError && (
                  <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                    {dialogError}
                  </p>
                )}
              </div>

              <DocumentTable
                documents={uploadRow.documents ?? []}
                pendingDocuments={pendingDocuments}
                entryDate={uploadRow.customer_entry_date || selectedRowCustomer?.entry_date}
                documentTypeName={documentTypeName}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" onClick={handleSubmit} disabled={uploading}>
                  {uploading ? "Submitting..." : "Submit"}
                </Button>
                <Button type="button" variant="destructive" onClick={closeUploadDialog}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-gray-700">{label}</div>
      <div className="mt-1 text-gray-600">{value || "-"}</div>
    </div>
  );
}

function DocumentTable({
  documents,
  pendingDocuments,
  entryDate,
  documentTypeName,
}: {
  documents: NocDocumentUploadRow[];
  pendingDocuments: PendingDocument[];
  entryDate?: string | null;
  documentTypeName: (id?: string | null) => string;
}) {
  const rows = [
    ...documents.map((document) => ({
      id: document.unique_id,
      entryDate: document.entry_date,
      documentType: documentTypeName(document.noc_doc_type_id),
      documentName: document.document_name,
      fileUrl: document.document_file,
      thumbnailUrl: document.document_file,
      mimeType: "",
      verifyDate: document.approve_date,
      verifyStatus: document.approve_status || "Pending",
      pending: false,
    })),
    ...pendingDocuments.map((document) => ({
      id: document.id,
      entryDate: entryDate ?? "",
      documentType: documentTypeName(document.documentTypeId),
      documentName: document.file.name,
      file: document.file,
      fileUrl: null,
      thumbnailUrl: document.previewUrl,
      mimeType: document.file.type,
      verifyDate: null,
      verifyStatus: "Pending",
      pending: true,
    })),
  ];

  const openPreview = (row: (typeof rows)[number]) => {
    const file = "file" in row ? (row.file as File) : null;
    const url = row.fileUrl || (file ? row.thumbnailUrl : null);
    if (!url) return;
    const fallbackName = url.split("?")[0].split("/").pop() || "document";

    openDocumentPopup(
      url,
      row.documentName || fallbackName,
      row.mimeType,
      Boolean(file),
    );
  };

  const isImageDocument = (row: (typeof rows)[number]) =>
    row.mimeType.startsWith("image/") ||
    /\.(jpe?g|png|webp)$/i.test(`${row.documentName} ${row.thumbnailUrl ?? ""}`);

  const isPdfDocument = (row: (typeof rows)[number]) =>
    row.mimeType === "application/pdf" ||
    /\.pdf$/i.test(`${row.documentName} ${row.thumbnailUrl ?? ""}`);

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">S.No</th>
              <th className="p-2">Entry Date</th>
              <th className="p-2">Document Type</th>
              <th className="p-2">View</th>
              <th className="p-2">Verify Date</th>
              <th className="p-2">Verify Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No documents added.</td></tr>
            ) : rows.map((row, index) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{displayDate(row.entryDate)}</td>
                <td className="p-2">{row.documentType}</td>
                <td className="p-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-12 items-center justify-center text-blue-600 hover:text-blue-800"
                    title="View document"
                    onClick={() => openPreview(row)}
                  >
                    {isImageDocument(row) && row.thumbnailUrl ? (
                      <img
                        src={row.thumbnailUrl}
                        alt={row.documentName || "Document"}
                        className="h-10 w-12 rounded border object-cover"
                      />
                    ) : isPdfDocument(row) ? (
                      <i className="pi pi-file-pdf text-2xl text-red-600" />
                    ) : (
                      <i className="pi pi-file text-2xl text-gray-600" />
                    )}
                  </button>
                </td>
                <td className="p-2">{displayDate(row.verifyDate)}</td>
                <td className="p-2">{row.verifyStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}
