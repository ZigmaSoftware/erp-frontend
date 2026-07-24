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
import { coProcessingApi } from "@/helpers/admin";
import type { CoProcessingCertificate } from "../types/salesService.types";

export default function CoProcessingList() {
  const [records, setRecords] = useState<CoProcessingCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    cpc_no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encCoProcessing } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encCoProcessing}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encCoProcessing}/${unique_id}/edit`;

  const fetchRecords = async () => {
    try {
      const res = await coProcessingApi.list();
      const payload: any = res;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : (payload.data?.results ?? []);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This co-processing record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await coProcessingApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchRecords();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: CoProcessingCertificate, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: CoProcessingCertificate) => (
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

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search co-processing records..."
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
            Co Processing
          </h1>
          <p className="text-gray-500 text-sm">
            Manage co-processing certificate records
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
        value={records}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["cpc_no", "customer_name", "site_name"]}
        header={header}
        emptyMessage="No co-processing records found."
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
          field="cpc_no"
          header="CPC No"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          field="cpc_month"
          header="CPC Month"
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="customer_name"
          header="Customer"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          field="site_name"
          header="Site"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column
          field="entry_date"
          header="Entry Date"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="diff"
          header="Diff"
          sortable
          style={{ minWidth: "100px" }}
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
