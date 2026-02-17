import { useEffect, useState, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { plantApi } from "@/helpers/admin";
import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { PencilIcon } from "@/icons";
import { extractErrorMessage } from "@/utils/errorUtils";


import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

/* --------------------------------------------------------
   TYPES
-------------------------------------------------------- */
type PlantRecord = {
  unique_id: string;
  plantName: string;
  siteName: string;
  is_active: boolean;
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
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    page: 1,
    rows: 10,
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();

  /* --------------------------------------------------------
     FETCH PLANTS (TEMPLATE APPLIED)
  -------------------------------------------------------- */
  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await plantApi.listPaginated(
        lazyParams.page,
        lazyParams.rows
      );
      const data = (res.results ?? []) as any[];

      const mapped: PlantRecord[] = data.map((item) => ({
        unique_id: item.unique_id,
        plantName: item.plant_name,
        siteName: item.site_name,
        is_active: item.is_active,
      }));

      mapped.sort((a, b) => a.plantName.localeCompare(b.plantName));
      setPlants(mapped);
      setTotalRecords(res.count ?? 0);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load plants",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [lazyParams.page, lazyParams.rows]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  /* --------------------------------------------------------
     GLOBAL SEARCH
  -------------------------------------------------------- */
  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  /* --------------------------------------------------------
     STATUS TOGGLE
  -------------------------------------------------------- */
  const statusBodyTemplate = (row: PlantRecord) => (
    <Switch
      checked={row.is_active}
      onCheckedChange={async (value) => {
        try {
          await plantApi.update(row.unique_id, { is_active: value });
          fetchPlants(); //  re-fetch (template style)
        } catch (error) {
          Swal.fire("Error", "Status update failed", "error");
        }
      }}
    />
  );

  /* --------------------------------------------------------
     ACTIONS
  -------------------------------------------------------- */
  const actionBodyTemplate = (row: PlantRecord) => (
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

  const indexTemplate = (_: any, options: any) =>
    (lazyParams.page - 1) * lazyParams.rows + options.rowIndex + 1;

  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

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
        lazy
        paginator
        rows={lazyParams.rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={(lazyParams.page - 1) * lazyParams.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        header={header}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="plantName" header="Plant Name" sortable />
        <Column field="siteName" header="Site Name" sortable />
        <Column header="Status" body={statusBodyTemplate} style={{ textAlign: "center" }} />
        <Column header="Actions" body={actionBodyTemplate} style={{ textAlign: "center" }} />
      </DataTable>
    </div>
  );
}
