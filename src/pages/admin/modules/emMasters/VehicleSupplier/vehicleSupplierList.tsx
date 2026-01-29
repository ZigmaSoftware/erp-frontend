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
import { vehicleSupplierApi } from "@/helpers/admin";

type VehicleSupplier = {
  unique_id: string;
  supplier_name: string;
  proprietor_name: string;
  mobile_no: string;
  gst_type?: string;
  transport_medium?: string;
  image?: string;
  is_active: boolean;
};

export default function VehicleSupplierList() {
  const [suppliers, setSuppliers] = useState<VehicleSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encEmMasters, encVehicleSupplier } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encVehicleSupplier}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encVehicleSupplier}/${id}/edit`;

  const normalizeSupplier = (item: any): VehicleSupplier => ({
    unique_id: String(item?.unique_id ?? item?.id ?? ""),
    supplier_name: item?.supplier_name ?? "",
    proprietor_name: item?.proprietor_name ?? "",
    mobile_no: item?.mobile_no ?? "",
    gst_type: item?.gst_type ?? "",
    transport_medium: item?.transport_medium ?? "",
    image: item?.image ?? "",
    is_active: Boolean(item?.is_active),
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await vehicleSupplierApi.list();
      console.log(res);
      const raw = Array.isArray(res)
        ? res
        : Array.isArray(res)
        ? res
        : res??[];

      setSuppliers(
        raw.map(normalizeSupplier).filter((i) => i.unique_id)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This vehicle supplier will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    await vehicleSupplierApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1200,
      showConfirmButton: false,
    });

    fetchSuppliers();
  };

  const statusTemplate = (row: VehicleSupplier) => {
    const updateStatus = async (value: boolean) => {
      await vehicleSupplierApi.update(row.unique_id, {
        is_active: value,
      });
      fetchSuppliers();
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (row: VehicleSupplier) => (
    <div className="flex gap-2 justify-center">
      <button onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}>
        <PencilIcon className="size-5 text-blue-600" />
      </button>
      <button onClick={() => handleDelete(row.unique_id)}>
        <TrashBinIcon className="size-5 text-red-600" />
      </button>
    </div>
  );

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    setFilters({ ...filters, global: { value, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilterValue(value);
  };

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-2 border px-3 py-1 rounded">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search suppliers..."
          className="p-inputtext-sm !border-0"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Suppliers</h1>
          <p className="text-sm text-gray-500">Manage vehicle suppliers</p>
        </div>

        <Button
          label="Add Supplier"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={suppliers}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        globalFilterFields={["supplier_name", "proprietor_name", "mobile_no"]}
        header={header}
        stripedRows
        showGridlines
        emptyMessage="No suppliers found"
      >
        <Column header="S.No" body={(_, { rowIndex }) => rowIndex + 1} />
        <Column
          header="Image"
          body={(row: VehicleSupplier) =>
            row.image ? (
              <img src={row.image} className="h-10 w-10 rounded object-cover" />
            ) : (
              <span className="text-xs text-gray-400">N/A</span>
            )
          }
        />
        <Column field="supplier_name" header="Supplier Name" sortable />
        <Column field="proprietor_name" header="Proprietor" sortable />
        <Column field="mobile_no" header="Mobile" />
        <Column field="transport_medium" header="Transport" />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
