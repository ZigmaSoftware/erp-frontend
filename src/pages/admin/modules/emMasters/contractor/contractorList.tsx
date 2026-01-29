import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

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

  const navigate = useNavigate();
  const { encEmMasters, encContractor } = getEncryptedRoute();

  const ENC_NEW = `/${encEmMasters}/${encContractor}/new`;
  const ENC_EDIT = (id: number) =>
    `/${encEmMasters}/${encContractor}/${id}/edit`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await contractorApi.list();
      const raw = Array.isArray(res) ? res : res?.data ?? [];
      setData(raw);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = async (row: Contractor, value: boolean) => {
    await contractorApi.update(row.id, { is_active: value });
    fetchData();
  };

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
      title: "Deleted",
      timer: 1200,
      showConfirmButton: false,
    });

    fetchData();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <Button
          label="Add Contractor"
          icon="pi pi-plus"
          onClick={() => navigate(ENC_NEW)}
        />
      </div>

      <DataTable
        value={data}
        loading={loading}
        paginator
        rows={10}
        stripedRows
      >
        <Column header="S.No" body={(_, opt) => opt.rowIndex + 1} />
        <Column field="contractor_code" header="Code" />
        <Column field="contractor_name" header="Name" sortable />
        <Column field="contact_person" header="Contact Person" />
        <Column field="mobile_no" header="Mobile" />
        <Column
          header="GST"
          body={(row: Contractor) =>
            row.gst_type === "yes" ? row.gst_no : "No"
          }
        />
        <Column
          header="Status"
          body={(row: Contractor) => (
            <Switch
              checked={row.is_active}
              onCheckedChange={(v) => toggleStatus(row, v)}
            />
          )}
        />
        <Column
          header="Actions"
          body={(row: Contractor) => (
            <div className="flex gap-2">
              <button onClick={() => navigate(ENC_EDIT(row.id))}>
                <PencilIcon className="size-5 text-blue-600" />
              </button>
              <button onClick={() => handleDelete(row.id)}>
                <TrashBinIcon className="size-5 text-red-600" />
              </button>
            </div>
          )}
        />
      </DataTable>
    </div>
  );
}
