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
import { Switch } from "@/components/ui/switch";
import { transportEntryApi } from "@/helpers/admin";
import type { TransportEntry } from "../types/salesMasters.types";

export default function TransportEntryList() {
  const [entries, setEntries] = useState<TransportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    transport_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesMasters, encTransportMaster } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesMasters}/${encTransportMaster}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesMasters}/${encTransportMaster}/${unique_id}/edit`;

  const fetchEntries = async () => {
    try {
      const res = await transportEntryApi.list();
      const payload: any = res;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : (payload.data?.results ?? []);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This transport entry will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await transportEntryApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchEntries();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: TransportEntry, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const transportTypeTemplate = (row: TransportEntry) =>
    row.transport_type === "creditor" ? "Creditor" : "Debitor";

  const siteNamesTemplate = (row: TransportEntry) =>
    row.site_names && row.site_names.length > 0 ? row.site_names.join(", ") : "-";

  const actionTemplate = (row: TransportEntry) => (
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

  const statusTemplate = (row: TransportEntry) => {
    const updateStatus = async (value: boolean) => {
      const formData = new FormData();
      formData.append("is_active", String(value));
      await transportEntryApi.update(row.unique_id, formData);
      fetchEntries();
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
          placeholder="Search transport entries..."
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
            Transport Entry
          </h1>
          <p className="text-gray-500 text-sm">
            Manage transport entry records
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
        value={entries}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["transport_name", "contact_person", "mobile_no"]}
        header={header}
        emptyMessage="No transport entries found."
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
          field="transport_name"
          header="Transport Name"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Transport Type"
          body={transportTypeTemplate}
          style={{ minWidth: "130px" }}
        />
        <Column
          field="mobile_no"
          header="Mobile No"
          style={{ minWidth: "130px" }}
        />
        <Column
          header="Site(s)"
          body={siteNamesTemplate}
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
