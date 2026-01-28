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
import { equipmentTypeApi } from "@/helpers/admin";

type EquipmentType = {
  unique_id: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  is_active: boolean;
};

export default function EquipmentTypeList() {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encEmMasters, encEquipmentType } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encEquipmentType}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encEmMasters}/${encEquipmentType}/${unique_id}/edit`;

  const normalizeEquipmentType = (item: any): EquipmentType => {
    const statusFromIsActive = item?.is_active;
    const statusFromStatus = item?.status;
    const derivedStatus =
      statusFromIsActive !== undefined && statusFromIsActive !== null
        ? Boolean(statusFromIsActive)
        : typeof statusFromStatus === "boolean"
          ? statusFromStatus
          : String(statusFromStatus ?? "").toLowerCase() === "active";

    return {
      unique_id: String(item?.unique_id ?? item?.id ?? ""),
      name:
        item?.name ??
        item?.equipment_type_name ??
        item?.equipmenttype_name ??
        "",
      description: item?.description ?? item?.remarks ?? "",
      category: item?.category ?? item?.category_name ?? "",
      image: item?.image ?? item?.image_url ?? "",
      is_active: derivedStatus,
    };
  };

  const fetchEquipmentTypes = async () => {
    setLoading(true);

    try {
      const res = await equipmentTypeApi.list();
      const payload: any = res;
      const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : payload?.data?.results ?? [];

      setEquipmentTypes(
        raw
          .map(normalizeEquipmentType)
          .filter((item: EquipmentType) => item.unique_id)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This equipment type will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await equipmentTypeApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchEquipmentTypes();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (
    _: EquipmentType,
    { rowIndex }: { rowIndex: number }
  ) => rowIndex + 1;

  const actionTemplate = (row: EquipmentType) => (
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

  const statusTemplate = (row: EquipmentType) => {
    const updateStatus = async (value: boolean) => {
      await equipmentTypeApi.update(row.unique_id, {
        name: row.name,
        equipment_type_name: row.name,
        description: row.description,
        category: row.category,
        is_active: value,
      });

      fetchEquipmentTypes();
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
          placeholder="Search equipment types..."
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
            Equipment Types
          </h1>
          <p className="text-gray-500 text-sm">
            Manage equipment type records
          </p>
        </div>

        <Button
          label="Add Equipment Type"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={equipmentTypes}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["name", "description", "category"]}
        header={header}
        emptyMessage="No equipment types found."
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
          field="image"
          header="Image"
          body={(row: EquipmentType) =>
            row.image ? (
              <img
                src={row.image}
                alt={row.name}
                className="h-10 w-10 rounded object-cover border"
              />
            ) : (
              <span className="text-gray-400 text-xs">N/A</span>
            )
          }
          style={{ width: "120px" }}
        />
        <Column
          field="name"
          header="Equipment Type"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="description"
          header="Description"
          sortable
          style={{ minWidth: "240px" }}
        />
        <Column
          field="category"
          header="Category"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px" }}
        />
        <Column
          header="Actions"
          body={actionTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );
}
