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
import { DISPOSAL_TYPE_OPTIONS } from "@/utils/disposalTypes";
import { Switch } from "@/components/ui/switch";
import { documentTypeServiceApi } from "@/helpers/admin";
import type { DocumentType } from "../types/salesService.types";

export default function DocumentTypeList() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    doc_type: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encDocumentType } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encDocumentType}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encDocumentType}/${unique_id}/edit`;

  const fetchDocumentTypes = async () => {
    try {
      const res = await documentTypeServiceApi.list();
      const payload: any = res;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : (payload.data?.results ?? []);
      setDocumentTypes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This document type will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await documentTypeServiceApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchDocumentTypes();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: DocumentType, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const disposalTypeTemplate = (row: DocumentType) =>
    DISPOSAL_TYPE_OPTIONS.find((option) => option.value === row.disposal_type)?.label ??
    row.disposal_type;

  const actionTemplate = (row: DocumentType) => (
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

  const statusTemplate = (row: DocumentType) => {
    const updateStatus = async (value: boolean) => {
      await documentTypeServiceApi.update(row.unique_id, {
        disposal_type: row.disposal_type,
        doc_type: row.doc_type,
        description: row.description,
        is_active: value,
      });

      fetchDocumentTypes();
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search document types..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Document Type Creation
          </h1>
          <p className="text-gray-500 text-sm">
            Manage document type records
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
        value={documentTypes}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["disposal_type", "doc_type", "description"]}
        header={header}
        emptyMessage="No document types found."
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
          field="disposal_type"
          body={disposalTypeTemplate}
          header="Disposal Type"
          sortable
          style={{ minWidth: "170px" }}
        />
        <Column
          field="doc_type"
          header="Document Type"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="description"
          header="Description"
          style={{ minWidth: "220px" }}
        />
        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px" }}
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
