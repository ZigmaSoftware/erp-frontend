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
import type { NocListRow } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

const DISPOSAL_TYPE_LABELS: Record<string, string> = {
  customer_scope: "Customer Scope",
  zigma_scope: "Zigma Scope",
  transport_scope: "Transport Scope",
};

export default function NocDocumentList() {
  const [rows, setRows] = useState<NocListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  const [customerFilter, setCustomerFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  /* ---------------- Upload dialog state ---------------- */
  const [uploadRow, setUploadRow] = useState<NocListRow | null>(null);
  const [docTypeId, setDocTypeId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS (customers with NOC upload enabled, sites)
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [customerList, siteList] = await Promise.all([
          customerCreationServiceApi.list(),
          siteApi.list(),
        ]);
        setCustomers(customerList as unknown[]);
        setSites(siteList as unknown[]);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load dropdown options",
          text: "Something went wrong!",
        });
      }
    };

    loadOptions();
  }, []);

  const customerOptions = useMemo(
    () =>
      toOptions(
        customers.filter((c: any) => c.noc_upload),
        (c) => c.unique_id,
        (c) => c.customer_name,
      ),
    [customers],
  );

  const siteOptions = useMemo(
    () => toOptions(sites, (s) => s.unique_id, (s) => s.site_name),
    [sites],
  );

  const siteNameById = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((s: any) => {
      if (s.unique_id) map.set(s.unique_id, s.site_name);
    });
    return map;
  }, [sites]);

  /* -----------------------------------------------------------
     LOAD WORKLIST
  ----------------------------------------------------------- */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (customerFilter) params.customer = customerFilter;
      if (siteFilter) params.site = siteFilter;

      const res = await customerItemPurposeServiceApi.action<NocListRow[]>(
        "noc-list",
        undefined,
        { params },
      );
      setRows(Array.isArray(res) ? res : []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed to load NOC upload list",
        text: "Something went wrong!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: NocListRow, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const siteNameTemplate = (row: NocListRow) =>
    siteNameById.get(row.site_id) ?? row.site_id;

  const disposalTypeTemplate = (row: NocListRow) =>
    DISPOSAL_TYPE_LABELS[row.disposal_type] ?? row.disposal_type;

  const verifyStatusTemplate = (value: string) =>
    value ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Yes
      </span>
    ) : (
      ""
    );

  const openUploadDialog = (row: NocListRow) => {
    setUploadRow(row);
    setDocTypeId(row.noc_doc_type_id ?? "");
    setDocumentName(row.document_name ?? "");
    setDocumentFile(null);
  };

  const handleUploadSubmit = async () => {
    if (!uploadRow) return;
    if (!documentFile && !uploadRow.document_file) {
      Swal.fire({ icon: "error", title: "Please choose a file to upload" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    if (docTypeId) formData.append("noc_doc_type_id", docTypeId);
    formData.append("document_name", documentName);
    if (documentFile) formData.append("document_file", documentFile);

    try {
      await nocDocumentApi.uploadUpdate(uploadRow.unique_id, formData);
      Swal.fire({
        icon: "success",
        title: "Uploaded successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      setUploadRow(null);
      fetchRows();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setUploading(false);
    }
  };

  const actionTemplate = (row: NocListRow) => (
    <div className="flex gap-3 justify-center">
      <button
        title="Upload NOC Document"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => openUploadDialog(row)}
      >
        <i className="pi pi-upload text-lg" />
      </button>

      <button
        title="View"
        className={
          row.document_file
            ? "text-gray-700 hover:text-black"
            : "text-gray-300 cursor-not-allowed"
        }
        disabled={!row.document_file}
        onClick={() =>
          row.document_file && window.open(row.document_file, "_blank")
        }
      >
        <i className="pi pi-eye text-lg" />
      </button>
    </div>
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

  return (
    <div className="px-3 py-3 w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">
          NOC Document Upload
        </h1>
        <p className="text-gray-500 text-sm">
          Upload NOC documents for each customer's destination and item
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
        <div>
          <Label>Customer Name</Label>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {customerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Site Name</Label>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {siteOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button onClick={fetchRows}>GO</Button>
        </div>
      </div>

      <DataTable
        value={rows}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={[
          "customer_name",
          "destination",
          "item_name",
          "disposal_type",
        ]}
        header={header}
        emptyMessage="No NOC upload records found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "70px" }} />
        <Column
          field="customer_name"
          header="Customer Name"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Site Name"
          body={siteNameTemplate}
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          field="destination"
          header="Destination"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          field="item_name"
          header="Item Name"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Disposal Type"
          body={disposalTypeTemplate}
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Disposal Type Verify Status"
          body={(row: NocListRow) =>
            verifyStatusTemplate(row.item_verification_status)
          }
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Destination Approve Status"
          body={(row: NocListRow) =>
            verifyStatusTemplate(row.destination_verification_status)
          }
          style={{ minWidth: "160px" }}
        />
        <Column
          header="NOC Upload / View"
          body={actionTemplate}
          style={{ width: "140px" }}
        />
      </DataTable>

      <Dialog open={Boolean(uploadRow)} onOpenChange={(open) => !open && setUploadRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload NOC Document</DialogTitle>
          </DialogHeader>

          {uploadRow && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {uploadRow.customer_name} &middot; {uploadRow.destination} &middot;{" "}
                {uploadRow.item_name}
              </div>

              <div>
                <Label>Document Type</Label>
                <DocTypeSelect value={docTypeId} onChange={setDocTypeId} />
              </div>

              <div>
                <Label>Document Name</Label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Document Name"
                />
              </div>

              <div>
                <Label>Document File</Label>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setDocumentFile(file);
                  }}
                />
                {uploadRow.document_file && !documentFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current file: {uploadRow.document_file.split("/").pop()}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={handleUploadSubmit} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setUploadRow(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [docTypes, setDocTypes] = useState<unknown[]>([]);

  useEffect(() => {
    documentTypeServiceApi
      .list()
      .then((list) => setDocTypes(list as unknown[]))
      .catch(() => undefined);
  }, []);

  const docTypeOptions = toOptions(
    docTypes,
    (d) => d.unique_id,
    (d) => d.doc_type,
  );

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {docTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
