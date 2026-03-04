import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import { Switch } from "@/components/ui/switch";
import { PencilIcon } from "@/icons";
import { contractorApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { useContractorsQuery } from "@/tanstack/admin";

type RawContractor = {
  id?: string | number;
  unique_id?: string | number;
  contractor_code?: string;
  contractor_name?: string;
  contact_person?: string;
  mobile_no?: string;
  gst_type?: string;
  gst_no?: string | null;
  pan_no?: string | null;
  is_active?: boolean | string | number | null;
};

type Contractor = {
  id: string;
  contractor_code: string;
  contractor_name: string;
  contact_person: string;
  mobile_no: string;
  gst_type: "yes" | "no";
  gst_no?: string | null;
  pan_no?: string | null;
  is_active: boolean;
};

type ContractorFilters = {
  global: { value: string | null; matchMode: FilterMatchMode };
  contractor_name: { value: string | null; matchMode: FilterMatchMode };
};

const contractorListQueryKey = [...masterQueryKeys.contractors, "list"] as const;

const toBoolean = (value: RawContractor["is_active"]): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  }
  return false;
};

const normalizeGstType = (value: string | undefined): "yes" | "no" =>
  String(value ?? "").toLowerCase() === "yes" ? "yes" : "no";

const normalizeContractor = (item: RawContractor): Contractor | null => {
  const id = item.id ?? item.unique_id;
  if (id == null) return null;

  return {
    id: String(id),
    contractor_code: item.contractor_code ?? "",
    contractor_name: item.contractor_name ?? "",
    contact_person: item.contact_person ?? "",
    mobile_no: item.mobile_no ?? "",
    gst_type: normalizeGstType(item.gst_type),
    gst_no: item.gst_no ?? null,
    pan_no: item.pan_no ?? null,
    is_active: toBoolean(item.is_active),
  };
};

export default function ContractorList() {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<ContractorFilters>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    contractor_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { encEmMasters, encContractor } = getEncryptedRoute();

  const ENC_NEW = `/${encEmMasters}/${encContractor}/new`;
  const ENC_EDIT = (id: string) => `/${encEmMasters}/${encContractor}/${id}/edit`;

  const query = useContractorsQuery();
  const normalizedData = (query.data ?? [])
    .map((item) => normalizeContractor(item as RawContractor))
    .filter((item): item is Contractor => item !== null);

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      contractorApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.contractors,
      });
    },
    onError: () => {
      Swal.fire("Error", "Status update failed", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contractorApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.contractors,
      });
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
    },
    onError: () => {
      Swal.fire("Error", "Delete failed", "error");
    },
  });

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This contractor will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const statusTemplate = (row: Contractor) => (
    <Switch
      checked={row.is_active}
      onCheckedChange={(checked) =>
        statusMutation.mutate({
          id: row.id,
          is_active: checked,
        })
      }
      disabled={statusMutation.isPending || deleteMutation.isPending}
    />
  );

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

  const onGlobalFilterChange = (e: { target: { value: string } }) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
  };

  const data = normalizedData;
  const loading = query.isLoading || query.isFetching;

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contractors</h1>
          <p className="text-gray-500 text-sm">Manage contractor master data</p>
        </div>

        <Button
          label="Add Contractor"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW)}
        />
      </div>

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
          body={(row: Contractor) => (row.gst_type === "yes" ? row.gst_no : "No")}
        />
        <Column header="Status" body={statusTemplate} />
        <Column header="Actions" body={actionTemplate} />
      </DataTable>
    </div>
  );
}
