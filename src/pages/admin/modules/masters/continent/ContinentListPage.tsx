import { useCallback, useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { Switch } from "@/components/ui/switch";
import { encryptSegment } from "@/utils/routeCrypto";
import { PencilIcon } from "@/icons";
import { continentApi } from "@/helpers/admin";

/* -----------------------------------------
   Types
----------------------------------------- */
type Continent = {
  unique_id: string;
  name: string;
  is_active: boolean;
};

const encMasters = encryptSegment("masters");
const encContinents = encryptSegment("continents");

const ENC_NEW_PATH = `/${encMasters}/${encContinents}/new`;
const ENC_EDIT_PATH = (id: string) =>
  `/${encMasters}/${encContinents}/${id}/edit`;

/* -----------------------------------------
   Component
----------------------------------------- */
export default function ContinentList() {
  const navigate = useNavigate();

  const [data, setData] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [lazyParams, setLazyParams] = useState({
    page: 1,
    rows: 5,
  });

  const [globalFilter, setGlobalFilter] = useState("");

  /* -----------------------------------------
     Fetch (Server-Side Pagination)
  ----------------------------------------- */
  const fetchContinents = useCallback(async () => {
    try {
      setLoading(true);

      const res = await continentApi.listPaginated(
        lazyParams.page,
        lazyParams.rows
      );

      setData(res.results);
      setTotalRecords(Number(res.count));
    } catch {
      Swal.fire("Error", "Failed to fetch continents", "error");
    } finally {
      setLoading(false);
    }
  }, [lazyParams]);

  useEffect(() => {
    fetchContinents();
  }, [fetchContinents]);

  /* -----------------------------------------
     Pagination Event
  ----------------------------------------- */
  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1, // PrimeReact is 0-based
      rows: event.rows,
    });
  };

  /* -----------------------------------------
     Status Toggle
  ----------------------------------------- */
  const statusTemplate = (row: Continent) => {
    const updateStatus = async (checked: boolean) => {
      try {
        await continentApi.update(row.unique_id, {
          name: row.name,
          is_active: checked,
        });
        fetchContinents();
      } catch {
        Swal.fire("Error", "Status update failed", "error");
      }
    };

    return <Switch checked={row.is_active} onCheckedChange={updateStatus} />;
  };

  /* -----------------------------------------
     Actions
  ----------------------------------------- */
  const actionTemplate = (row: Continent) => (
    <button
      onClick={() => navigate(ENC_EDIT_PATH(row.unique_id))}
      className="text-blue-600 hover:text-blue-800"
      title="Edit"
    >
      <PencilIcon className="size-5" />
    </button>
  );

  const indexTemplate = (_: any, options: any) =>
    (lazyParams.page - 1) * lazyParams.rows + options.rowIndex + 1;

  /* -----------------------------------------
     Header
  ----------------------------------------- */
  const header = (
    <div className="flex justify-end">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search (UI only)"
          className="p-inputtext-sm"
        />
      </span>
    </div>
  );

  /* -----------------------------------------
     Render
  ----------------------------------------- */
  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Continents</h1>
          <p className="text-gray-500 text-sm">
            Manage continent records
          </p>
        </div>

        <Button
          label="Add Continent"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={data}
        lazy
        paginator
        rows={lazyParams.rows}
        first={(lazyParams.page - 1) * lazyParams.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        dataKey="unique_id"
        header={header}
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />

        <Column
          field="name"
          header="Continent Name"
          sortable={false}
          style={{ minWidth: "200px" }}
        />

        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />

        <Column
          header="Actions"
          body={actionTemplate}
          style={{ width: "120px", textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
