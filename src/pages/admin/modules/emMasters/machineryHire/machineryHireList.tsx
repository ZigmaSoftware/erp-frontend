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
import { machineryHireApi } from "@/helpers/admin";

export type VehicleRecord = {
  id: number;
  unique_id: string;

  site_id: string;
  site_name: string;

  equipment_type_id: string;
  equipment_type_name: string;

  equipment_model_id: string;
  equipment_model_name: string;

  vehicle_id: string;
  vehicle_code: string;

  date: string;
  diesel_status: "WITH_DIESEL" | "WITHOUT_DIESEL" | string;

  hire_rate: string;
  unit: string;

  is_active: boolean;
  is_deleted: boolean;
};

export default function MachineryHireList() {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();
  const { encEmMasters, encMachineryHire } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encMachineryHire}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encMachineryHire}/${id}/edit`;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await machineryHireApi.list();
      console.log(res);
      const raw = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.data?.results) ? (res as any).data.results : []));
      console.log("raw", raw);

      setRecords(raw.filter((item: VehicleRecord) => item.unique_id));
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load machinery hire records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    await machineryHireApi.remove(unique_id);

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
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: VehicleRecord, { rowIndex }: any) =>
    rowIndex + 1;

  const statusTemplate = (row: VehicleRecord) => {
    const updateStatus = async (value: boolean) => {
      await machineryHireApi.update(row.unique_id, {
        is_active: value,
      });

      fetchRecords();
    };

    return (
      <Switch checked={row.is_active} onCheckedChange={updateStatus} />
    );
  };

  const actionTemplate = (row: VehicleRecord) => (
    <div className="flex gap-2 justify-center">
      <button
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search machinery hire..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Machinery Hire
          </h1>
          <p className="text-gray-500 text-sm">
            Manage machinery hire records
          </p>
        </div>

        <Button
          label="Add Machinery Hire"
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
        globalFilterFields={[
          "site_name",
          "equipment_type_name",
          "equipment_model_name",
          "vehicle_code",
        ]}
        header={header}
        emptyMessage="No records found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="site_name" header="Site" sortable />
        <Column field="equipment_type_name" header="Type" sortable />
        <Column field="equipment_model_name" header="Model" sortable />
        <Column field="vehicle_code" header="Vehicle Code" sortable />
        <Column field="date" header="Date" sortable />
        <Column field="diesel_status" header="Diesel Status" sortable />
        <Column field="hire_rate" header="Hire Rate" sortable />
        <Column field="unit" header="Unit" sortable />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}