import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
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

import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { receivableApi } from "@/helpers/admin";
import type { Receivable } from "../types/salesService.types";

const statusLabel = (code: string) => {
  switch (code) {
    case "0": return "Pending";
    case "1": return "Approved";
    case "2": return "Rejected";
    default: return code || "-";
  }
};

export default function ReceivableList() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receivable_no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encReceivable } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encReceivable}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encReceivable}/${unique_id}/edit`;

  const fetchReceivables = async () => {
    try {
      const res = (await receivableApi.list()) as Receivable[];
      setReceivables(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This receivable record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await receivableApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchReceivables();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: Receivable, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: Receivable) => (
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
          placeholder="Search receivables..."
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
            Receivable
          </h1>
          <p className="text-gray-500 text-sm">
            Manage receivable records
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
        value={receivables}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["receivable_no", "customer_name", "site_name"]}
        header={header}
        emptyMessage="No receivable records found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          field="receivable_no"
          header="Receivable No"
          sortable
          style={{ minWidth: "160px" }}
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
          style={{ minWidth: "140px" }}
        />
        <Column
          field="entry_date"
          header="Entry Date"
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          field="net_amount"
          header="Net Amount"
          style={{ minWidth: "120px" }}
        />
        <Column
          header="Approval Status"
          body={(row: Receivable) => statusLabel(row.appr_status)}
          style={{ width: "150px" }}
        />
        <Column header="Action" body={actionTemplate} style={{ width: "150px" }} />
      </DataTable>
    </div>
  );
}
