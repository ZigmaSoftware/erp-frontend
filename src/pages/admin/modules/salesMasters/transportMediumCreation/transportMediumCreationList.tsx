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
import { Switch } from "@/components/ui/switch";
import { transportMediumCreationApi } from "@/helpers/admin";
import type { TransportMediumCreation } from "../types/salesMasters.types";

export default function TransportMediumCreationList() {
  const [transportMediums, setTransportMediums] = useState<TransportMediumCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    vehicle_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesMasters, encTransportMediumCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesMasters}/${encTransportMediumCreation}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesMasters}/${encTransportMediumCreation}/${unique_id}/edit`;

  const fetchTransportMediums = async () => {
    try {
      const res = (await transportMediumCreationApi.list()) as TransportMediumCreation[];
      setTransportMediums(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportMediums();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This transport medium will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await transportMediumCreationApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchTransportMediums();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: TransportMediumCreation, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: TransportMediumCreation) => (
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

  const statusTemplate = (row: TransportMediumCreation) => {
    const updateStatus = async (value: boolean) => {
      await transportMediumCreationApi.update(row.unique_id, {
        vehicle_name: row.vehicle_name,
        description: row.description,
        is_active: value,
      });

      fetchTransportMediums();
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
          placeholder="Search transport mediums..."
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
            Transport Medium Creation
          </h1>
          <p className="text-gray-500 text-sm">
            Manage transport medium records
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
        value={transportMediums}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["vehicle_name", "description"]}
        header={header}
        emptyMessage="No transport mediums found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          field="vehicle_name"
          header="Vehicle Name"
          sortable
          style={{ minWidth: "260px" }}
        />
        <Column
          field="description"
          header="Description"
          style={{ minWidth: "360px" }}
        />
        <Column header="Status" body={statusTemplate} style={{ width: "150px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "150px" }} />
      </DataTable>
    </div>
  );
}
