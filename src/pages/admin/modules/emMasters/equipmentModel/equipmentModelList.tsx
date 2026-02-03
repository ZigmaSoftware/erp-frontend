import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { Switch } from "@/components/ui/switch";
import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentModelApi } from "@/helpers/admin";

type EquipmentModel = {
  unique_id: string;
  equipment_type: string;
  manufacturer: string;
  model_name: string;
  description: string;
  is_active: boolean;
};

export default function EquipmentModelList() {
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    model_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encEmMasters, encEquipmentModel } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encEmMasters}/${encEquipmentModel}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encEmMasters}/${encEquipmentModel}/${id}/edit`;

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await equipmentModelApi.list();
      const raw = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.data?.results) ? (res as any).data.results : []));
console.log("raw", raw);
      setModels(
        raw.map((item: any) => ({
          unique_id: item.unique_id,
          equipment_type: item?.equipment_type_name ?? item?.equipment_type?.name ?? "",
          manufacturer: item.manufacturer,
          model_name: item.model_name,
          description: item.description,
          is_active: Boolean(item.is_active),
        }))
      
      );
      
    } finally {
      setLoading(false);
    }
  };
    console.log("models", models);

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This equipment model will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    await equipmentModelApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      timer: 1200,
      showConfirmButton: false,
    });

    fetchModels();
  };

  const statusTemplate = (row: EquipmentModel) => {
    const toggleStatus = async (value: boolean) => {
      await equipmentModelApi.update(row.unique_id, {
        is_active: value,
      });
      fetchModels();
    };

    return <Switch checked={row.is_active} onCheckedChange={toggleStatus} />;
  };

  const actionTemplate = (row: EquipmentModel) => (
    <div className="flex gap-2 justify-center">
      <button onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}>
        <PencilIcon className="size-5 text-blue-600" />
      </button>
      {/* <button onClick={() => handleDelete(row.unique_id)}>
        <TrashBinIcon className="size-5 text-red-600" />
      </button> */}
    </div>
  );

  const onGlobalFilterChange = (e: any) => {
    setGlobalFilterValue(e.target.value);
    setFilters({
      ...filters,
      global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipment Models</h1>
          <p className="text-gray-500 text-sm">Manage equipment models</p>
        </div>

        <Button
          label="Add Equipment Model"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={models}
        loading={loading}
        paginator
        rows={10}
        filters={filters}
        globalFilterFields={[
          "model_name",
          "manufacturer",
          "equipment_type",
        ]}
        header={
          <div className="flex justify-end">
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search models..."
            />
          </div>
        }
        stripedRows
        showGridlines
      >
        <Column header="S.No" body={(_, { rowIndex }) => rowIndex + 1} />
        <Column field="equipment_type" header="Equipment Type" sortable />
        <Column field="manufacturer" header="Manufacturer" sortable />
        <Column field="model_name" header="Model Name" sortable />
        <Column field="description" header="Description" />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
