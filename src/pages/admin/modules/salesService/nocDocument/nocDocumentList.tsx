import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { nocDocumentApi } from "@/helpers/admin";
import type { NocDocument } from "../types/salesService.types";

export default function NocDocumentList() {
  const [documents, setDocuments] = useState<NocDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    scrap_customer_id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encNocDocument } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encNocDocument}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encNocDocument}/${unique_id}/edit`;

  const fetchDocuments = async () => {
    try {
      const res = await nocDocumentApi.list();
      const payload: any = res;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : (payload.data?.results ?? []);
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This NOC document will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await nocDocumentApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchDocuments();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: NocDocument, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: NocDocument) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.unique_id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const approveStatusTemplate = (row: NocDocument) => {
    const statusColors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approve: "bg-green-100 text-green-800",
      Reject: "bg-red-100 text-red-800",
      Cancel: "bg-gray-100 text-gray-800",
    };
    const color = statusColors[row.approve_status] ?? "bg-gray-100 text-gray-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {row.approve_status}
      </span>
    );
  };

  const overallStatusTemplate = (row: NocDocument) => {
    const color =
      row.overall_approve_status === "Approve"
        ? "bg-green-100 text-green-800"
        : "bg-yellow-100 text-yellow-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {row.overall_approve_status}
      </span>
    );
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search documents..."
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
            NOC Document
          </h1>
          <p className="text-gray-500 text-sm">
            Manage NOC document records
          </p>
        </div>

        <Button
          label="Add New"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={documents}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["scrap_customer_id", "site_name", "document_name"]}
        header={header}
        emptyMessage="No NOC documents found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column
          header="S.No"
          body={indexTemplate}
          style={{ width: "80px" }}
        />
        <Column
          field="scrap_customer_id"
          header="Customer ID"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          field="site_name"
          header="Site"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          field="noc_doc_type_id"
          header="Document Type"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          header="Approve Status"
          body={approveStatusTemplate}
          style={{ minWidth: "140px" }}
        />
        <Column
          header="Overall Status"
          body={overallStatusTemplate}
          style={{ minWidth: "140px" }}
        />
        <Column
          header="Action"
          body={actionTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );
}
