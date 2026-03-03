import { useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";

import { plantApi } from "@/helpers/admin";
import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { PencilIcon } from "@/icons";
import { extractErrorMessage } from "@/utils/errorUtils";
import { masterQueryKeys, type PlantRecord } from "@/types/tanstack/masters";
import { usePlantsQuery } from "@/tanstack/admin";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const encMasters = encryptSegment("masters");
const encPlantCreation = encryptSegment("plant-creation");

const ENC_NEW_PATH = `/${encMasters}/${encPlantCreation}/new`;
const ENC_EDIT_PATH = (id: string | number) =>
  `/${encMasters}/${encPlantCreation}/${id}/edit`;

export default function PlantList() {
  const [rows, setRows] = useState(10);
  const [first, setFirst] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const plantsQuery = usePlantsQuery();
  const queryKey = [...masterQueryKeys.plants];

  const statusBodyTemplate = (row: PlantRecord) => (
    <Switch
      checked={row.is_active}
      onCheckedChange={async (value) => updateStatus(row, value)}
    />
  );

  const updateStatus = async (row: PlantRecord, value: boolean) => {
    try {
      queryClient.setQueryData<PlantRecord[]>(queryKey, (data) => {
        if (!data) return data;
        return data.map((plant) =>
          plant.unique_id === row.unique_id ? { ...plant, is_active: value } : plant
        );
      });
      await plantApi.update(row.unique_id, { is_active: value });
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey });
      Swal.fire("Error", extractErrorMessage(error), "error");
    }
  };

  const header = (
    <div className="flex justify-end">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Search plants..."
          className="p-inputtext-sm border-0 shadow-none"
        />
      </div>
    </div>
  );

  const plantRows = useMemo(() => {
    const rows = plantsQuery.data ?? [];
    if (!globalFilterValue.trim()) return rows;
    const term = globalFilterValue.toLowerCase();
    return rows.filter((plant) =>
      [plant.plant_name, plant.site_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [plantsQuery.data, globalFilterValue]);

  const indexTemplate = (_: any, options: any) => first + options.rowIndex + 1;

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
        value={plantRows}
        dataKey="unique_id"
        paginator
        rows={rows}
        rowsPerPageOptions={[5, 10, 25, 50]}
        first={first}
        totalRecords={plantRows.length}
        onPage={(event) => {
          setFirst(event.first);
          setRows(event.rows);
        }}
        loading={plantsQuery.isFetching}
        header={header}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column field="plant_name" header="Plant Name" sortable />
        <Column field="site_name" header="Site Name" sortable />
        <Column header="Status" body={statusBodyTemplate} style={{ textAlign: "center" }} />
        <Column
          header="Actions"
          body={(row: PlantRecord) => (
            <div className="flex justify-center">
              <button
                onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
                className="text-blue-600 hover:text-blue-800"
                title="Edit"
              >
                <PencilIcon className="size-5" />
              </button>
            </div>
          )}
          style={{ textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
