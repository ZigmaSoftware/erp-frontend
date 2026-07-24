import { useEffect, useMemo, useState } from "react";
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
import { aggregateEntryApi, siteApi, plantApi } from "@/helpers/admin";
import type { AggregateEntry } from "../types/salesService.types";

export default function AggregateEntryList() {
  const [entries, setEntries] = useState<AggregateEntry[]>([]);
  const [siteMap, setSiteMap] = useState<Record<string, string>>({});
  const [plantMap, setPlantMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    scrap_no: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encAggregateEntry } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encAggregateEntry}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encAggregateEntry}/${unique_id}/edit`;

  const fetchEntries = async () => {
    try {
      const res = await aggregateEntryApi.list();
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

  const fetchMasters = async () => {
    try {
      const [siteList, plantList] = await Promise.all([siteApi.list(), plantApi.list()]);
      setSiteMap(
        Object.fromEntries(
          (siteList as any[]).map((s) => [s.unique_id, s.site_name]),
        ),
      );
      setPlantMap(
        Object.fromEntries(
          (plantList as any[]).map((p) => [p.unique_id, p.plant_name]),
        ),
      );
    } catch {
      /* names simply fall back to the stored id if masters fail to load */
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchMasters();
  }, []);

  const rows = useMemo(
    () =>
      entries.map((row) => ({
        ...row,
        site_display: siteMap[row.site_name] ?? row.site_name,
        plant_display: row.plant_name ? (plantMap[row.plant_name] ?? row.plant_name) : "-",
      })),
    [entries, siteMap, plantMap],
  );

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This aggregate entry will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await aggregateEntryApi.remove(unique_id);

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

  const indexTemplate = (_: AggregateEntry, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const dateTemplate = (row: AggregateEntry) => {
    if (!row.entry_date) return "-";
    const date = new Date(row.entry_date);
    if (Number.isNaN(date.getTime())) return row.entry_date;
    return date.toLocaleDateString("en-GB");
  };

  const actionTemplate = (row: AggregateEntry) => (
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
          placeholder="Search entries..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Aggregate Entry</h1>
          <p className="text-gray-500 text-sm">Manage aggregate entry records</p>
        </div>

        <Button
          label="Add New"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={rows}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["scrap_no", "site_display", "plant_display", "description"]}
        header={header}
        emptyMessage="No aggregate entries found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column header="Date" body={dateTemplate} sortable style={{ minWidth: "120px" }} />
        <Column
          field="scrap_no"
          header="Aggregate Entry No"
          sortable
          style={{ minWidth: "160px" }}
        />
        <Column field="site_display" header="Site Name" sortable style={{ minWidth: "160px" }} />
        <Column field="plant_display" header="Plant Name" sortable style={{ minWidth: "160px" }} />
        <Column field="description" header="Description" style={{ minWidth: "220px" }} />
        <Column field="created_by" header="Created User" style={{ minWidth: "140px" }} />
        <Column field="updated_by" header="Updated User" style={{ minWidth: "140px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "120px" }} />
      </DataTable>
    </div>
  );
}
