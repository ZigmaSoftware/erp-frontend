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
import { afrRfqApi } from "@/helpers/admin";
import type { AfrTransportRfq } from "../types/salesService.types";

export default function AfrRfqList() {
  const [rfqs, setRfqs] = useState<AfrTransportRfq[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    request_quotation_transportation: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encAfrRfq } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encAfrRfq}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encAfrRfq}/${unique_id}/edit`;

  const fetchRfqs = async () => {
    try {
      const res = await afrRfqApi.list();
      const payload: any = res;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : (payload.data?.results ?? []);
      setRfqs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This RFQ will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await afrRfqApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchRfqs();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: AfrTransportRfq, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const dateTemplate = (row: AfrTransportRfq) => {
    if (!row.due_date) return "-";
    const date = new Date(row.due_date);
    if (Number.isNaN(date.getTime())) return row.due_date;
    return date.toLocaleDateString("en-IN");
  };

  const statusTemplate = (row: AfrTransportRfq) => {
    const color = row.status
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {row.status ? "Active" : "Inactive"}
      </span>
    );
  };

  const actionTemplate = (row: AfrTransportRfq) => (
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
          placeholder="Search RFQs..."
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
            AFR Transport RFQ
          </h1>
          <p className="text-gray-500 text-sm">
            Manage AFR transport RFQ records
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
        value={rfqs}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["request_quotation_transportation", "source", "destination"]}
        header={header}
        emptyMessage="No RFQs found."
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
          field="request_quotation_transportation"
          header="Transport Type"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          field="source"
          header="Source"
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
          field="load_type"
          header="Load Type"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Due Date"
          body={dateTemplate}
          style={{ minWidth: "130px" }}
        />
        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "120px" }}
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
