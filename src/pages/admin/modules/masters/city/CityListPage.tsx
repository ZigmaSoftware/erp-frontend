import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { encryptSegment } from "@/utils/routeCrypto";
import { Switch } from "@/components/ui/switch";
import { cityApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";

type CityRecord = {
  unique_id: string;
  name: string;
  is_active: boolean;
  country_name: string;
  state_name: string;
  district_name: string;
};


export default function CityList() {
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    page: 1,
    rows: 10,
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const navigate = useNavigate();

  const encMasters = encryptSegment("masters");
  const encCities = encryptSegment("cities");

  const ENC_NEW_PATH = `/${encMasters}/${encCities}/new`;
  const ENC_EDIT_PATH = (id: string) =>
    `/${encMasters}/${encCities}/${id}/edit`;

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cityApi.listPaginated(
        lazyParams.page,
        lazyParams.rows
      );
      setCities(res.results as CityRecord[]);
      setTotalRecords(res.count ?? 0);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to load cities",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [lazyParams.page, lazyParams.rows]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This city will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    await cityApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchCities();
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilterValue(e.target.value);
  };

  const renderHeader = () => (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search Cities..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const cap = (str?: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const statusTemplate = (city: CityRecord) => {
    const updateStatus = async (value: boolean) => {
      try {
        await cityApi.update(city.unique_id, { is_active: value });
        fetchCities();
      } catch (error) {
        console.error("Status update failed:", error);
      }
    };

    return <Switch checked={city.is_active} onCheckedChange={updateStatus} />;
  };

  const actionTemplate = (city: CityRecord) => (
    <div className="flex gap-3">
      <button
        onClick={() => navigate(ENC_EDIT_PATH(city.unique_id))}
        className="text-blue-600 hover:text-blue-800"
      >
        <PencilIcon className="size-5" />
      </button>

      {/* <button
        onClick={() => handleDelete(city.unique_id)}
        className="text-red-600 hover:text-red-800"
      >
        <TrashBinIcon className="size-5" />
      </button> */}
    </div>
  );

  const indexTemplate = (_: CityRecord, { rowIndex }: { rowIndex: number }) =>
    (lazyParams.page - 1) * lazyParams.rows + rowIndex + 1;

  const onPage = (event: any) => {
    setLazyParams({
      page: event.page + 1,
      rows: event.rows,
    });
  };

  return (
    <div className="p-3">
   
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Cities</h1>
            <p className="text-gray-500 text-sm">Manage city records</p>
          </div>

          <Button
            label="Add City"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => navigate(ENC_NEW_PATH)}
          />
        </div>

        <DataTable
          value={cities}
          dataKey="unique_id"
          lazy
          paginator
          rows={lazyParams.rows}
          rowsPerPageOptions={[5, 10, 25, 50]}
          first={(lazyParams.page - 1) * lazyParams.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={renderHeader()}
          stripedRows
          showGridlines
          emptyMessage="No cities found."
          className="p-datatable-sm"
        >
          <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
          <Column
            field="country_name"
            header="Country"
            body={(r) => cap(r.country_name)}
            sortable
          />
          <Column
            field="state_name"
            header="State"
            body={(r) => cap(r.state_name)}
            sortable
          />
          <Column
            field="district_name"
            header="District"
            body={(r) => cap(r.district_name)}
            sortable
          />
          <Column
            field="name"
            header="City"
            body={(r) => cap(r.name)}
            sortable
          />
          <Column header="Status" body={statusTemplate} />
          <Column header="Actions" body={actionTemplate} />
        </DataTable>

    </div>
  );
}
