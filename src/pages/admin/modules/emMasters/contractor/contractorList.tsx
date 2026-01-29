import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { Switch } from "@/components/ui/switch";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { contractorApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

type Contractor = {
  id: number;
  contractor_code: string;
  contractor_name: string;
  contact_person: string;
  mobile_no: string;
  gst_type: "yes" | "no";
  gst_no?: string | null;
  pan_no?: string | null;
  is_active: boolean;
};

export default function ContractorList() {
  const [data, setData] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    contractor_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encEmMasters, encContractor } = getEncryptedRoute();

  const ENC_NEW = `/${encEmMasters}/${encContractor}/new`;
  const ENC_EDIT = (id: number) =>
    `/${encEmMasters}/${encContractor}/${id}/edit`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await contractorApi.list();
      const raw = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : res?.data?.results ?? [];

      setData(raw);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- STATUS TOGGLE ---------------- */
  const statusTemplate = (row: Contractor) => {
    const toggleStatus = async (value: boolean) => {
      await contractorApi.update(row.id, { is_active: value });
      fetchData();
    };

    return (
      <Switch
        checked={row.is_active}
        onCheckedChange={toggleStatus}
      />
    );
  };

  /* ---------------- ACTIONS ---------------- */
  const actionTemplate = (row: Contractor) => (
    <div className="flex gap-2 justify-center">
      <button onClick={() => navigate(ENC_EDIT(row.id))}>
        <PencilIcon className="size-5 text-blue-600" />
      </button>
      {/* <button onClick={() => handleDelete(row.id)}>
        <TrashBinIcon className="size-5 text-red-600" />
      </button> */}
    </div>
  );

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This contractor will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    await contractorApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      timer: 1200,
      showConfirmButton: false,
    });

    fetchData();
  };

  /* ---------------- GLOBAL SEARCH ---------------- */
  const onGlobalFilterChange = (e: any) => {
    setGlobalFilterValue(e.target.value);
    setFilters({
      ...filters,
      global: { value: e.target.value, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contractors</h1>
          <p className="text-gray-500 text-sm">
            Manage contractor master data
          </p>
        </div>

        <Button
          label="Add Contractor"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW)}
        />
      </div>

      {/* Table */}
      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={10}
        filters={filters}
        globalFilterFields={[
          "contractor_name",
          "contractor_code",
          "mobile_no",
          "contact_person",
        ]}
        header={
          <div className="flex justify-end">
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Search contractors..."
            />
          </div>
        }
        stripedRows
        showGridlines
      >
        <Column header="S.No" body={(_, opt) => opt.rowIndex + 1} />
        <Column field="contractor_code" header="Contractor Code" sortable />
        <Column field="contractor_name" header="Name" sortable />
        <Column field="contact_person" header="Contact Person" />
        <Column field="mobile_no" header="Mobile" />
        <Column
          header="GST"
          body={(row: Contractor) =>
            row.gst_type === "yes" ? row.gst_no : "No"
          }
        />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
