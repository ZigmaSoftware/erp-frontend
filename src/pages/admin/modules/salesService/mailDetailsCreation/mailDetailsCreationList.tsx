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
import { mailDetailsCreationServiceApi } from "@/helpers/admin";
import type { MailDetailsCreation } from "../types/salesService.types";

export default function MailDetailsCreationList() {
  const [mailDetails, setMailDetails] = useState<MailDetailsCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    mail_type: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encMailDetailsCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encMailDetailsCreation}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encMailDetailsCreation}/${unique_id}/edit`;

  const fetchMailDetails = async () => {
    try {
      const res = (await mailDetailsCreationServiceApi.list()) as MailDetailsCreation[];
      setMailDetails(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailDetails();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This mail detail will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await mailDetailsCreationServiceApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchMailDetails();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: MailDetailsCreation, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: MailDetailsCreation) => (
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

  const statusTemplate = (row: MailDetailsCreation) => {
    const updateStatus = async (value: boolean) => {
      await mailDetailsCreationServiceApi.update(row.unique_id, {
        mail_type: row.mail_type,
        mail_ids: row.mail_ids,
        site: row.site,
        is_active: value,
      });

      fetchMailDetails();
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
          placeholder="Search mail details..."
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
            Mail Details Creation
          </h1>
          <p className="text-gray-500 text-sm">
            Manage mail detail records
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
        value={mailDetails}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["mail_type", "mail_ids", "site_name"]}
        header={header}
        emptyMessage="No mail details found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="SNo" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          field="mail_type"
          header="Type"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          field="mail_ids"
          header="Mail Ids"
          sortable
          style={{ minWidth: "360px" }}
        />
        <Column
          field="site_name"
          header="Site Name"
          sortable
          style={{ minWidth: "220px" }}
        />
        <Column header="Status" body={statusTemplate} style={{ width: "150px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "150px" }} />
      </DataTable>
    </div>
  );
}
