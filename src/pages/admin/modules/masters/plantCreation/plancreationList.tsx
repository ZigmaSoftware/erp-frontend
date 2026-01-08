import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { plantApi } from "@/helpers/admin";
import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { PencilIcon } from "@/icons";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

/* --------------------------------------------------------
   TYPES
-------------------------------------------------------- */
type Plant = {
  unique_id: string;
  plantName: string;
  siteName: string;
  is_active: boolean;
};

type TableFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
};

/* --------------------------------------------------------
   ROUTES
-------------------------------------------------------- */
const encMasters = encryptSegment("masters");
const encPlantCreation = encryptSegment("plant-creation");

const ENC_NEW_PATH = `/${encMasters}/${encPlantCreation}/new`;
const ENC_EDIT_PATH = (id: string) =>
  `/${encMasters}/${encPlantCreation}/${id}/edit`;

/* --------------------------------------------------------
   COMPONENT
-------------------------------------------------------- */
export default function PlantList() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState<TableFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const navigate = useNavigate();

  /* --------------------------------------------------------
     FETCH PLANTS
  -------------------------------------------------------- */
useEffect(() => {
  const fetchPlants = async () => {
    try {
      setLoading(true);

      const rawData = await plantApi.list(); //

      const mappedPlants: Plant[] = rawData.map((item: any) => ({
        unique_id: item.unique_id,
        plantName: item.plant_name,
        siteName: item.site,
        is_active: item.is_active,
      }));

      setPlants(mappedPlants);
    } catch (error) {
      console.error("Failed to load plants", error);
      Swal.fire("Error", "Failed to load plants", "error");
    } finally {
      setLoading(false);
    }
  };

  fetchPlants();
}, []);

  /* --------------------------------------------------------
     GLOBAL SEARCH
  -------------------------------------------------------- */
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });

    setGlobalFilterValue(value);
  };

  /* --------------------------------------------------------
     STATUS TOGGLE
  -------------------------------------------------------- */
  const statusBodyTemplate = (row: Plant) => {
    const updateStatus = async (checked: boolean) => {
      try {
        setPlants((prev) =>
          prev.map((p) =>
            p.unique_id === row.unique_id
              ? { ...p, is_active: checked }
              : p
          )
        );

        // OPTIONAL API CALL
        // await plantApi.update(row.unique_id, { is_active: checked });

      } catch (error) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  /* --------------------------------------------------------
     ACTIONS
  -------------------------------------------------------- */
  const actionBodyTemplate = (row: Plant) => (
    <div className="flex justify-center">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
        className="text-blue-600 hover:text-blue-800"
        title="Edit"
      >
        <PencilIcon className="size-5" />
      </button>
    </div>
  );

  const indexTemplate = (_: any, options: any) => options.rowIndex + 1;

  /* --------------------------------------------------------
     HEADER
  -------------------------------------------------------- */
  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search plants..."
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  /* --------------------------------------------------------
     RENDER
  -------------------------------------------------------- */
  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Plants</h1>
          <p className="text-gray-500 text-sm">Manage plant records</p>
        </div>

        <Button
          label="Add Plant"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={plants}
        dataKey="unique_id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        loading={loading}
        filters={filters}
        globalFilterFields={["plantName", "siteName"]}
        header={header}
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
          field="plantName"
          header="Plant Name"
          sortable
          style={{ minWidth: "200px" }}
        />

        <Column
          field="siteName"
          header="Site Name"
          sortable
          style={{ minWidth: "200px" }}
        />

        <Column
          header="Status"
          body={statusBodyTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />

        <Column
          header="Actions"
          body={actionBodyTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
