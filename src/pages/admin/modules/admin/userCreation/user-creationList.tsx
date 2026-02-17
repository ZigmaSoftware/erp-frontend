import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { DataTable } from "primereact/datatable";
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
import { userCreationApi } from "@/helpers/admin";

const normalizeList = (payload: any) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload?.data?.results ?? [];

const buildFullName = (row: any) =>
  [row?.first_name, row?.last_name].filter(Boolean).join(" ");

export default function UserCreationList() {
  const navigate = useNavigate();
  const { encAdmins, encUserCreation } = getEncryptedRoute();

  const ENC_NEW = `/${encAdmins}/${encUserCreation}/new`;
  const ENC_EDIT = (id: string | number) =>
    `/${encAdmins}/${encUserCreation}/${id}/edit`;

  const [users, setUsers] = useState<any[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  /* ---------------- FETCH ---------------- */
  const fetchUsers = async () => {
    try {
      const usersRes = await userCreationApi.list();
      console.log(usersRes);
      setUsers(normalizeList(usersRes));
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ---------------- ACTIONS ---------------- */
  const handleDelete = async (id: string | number) => {
    const r = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });

    if (!r.isConfirmed) return;

    try {
      await userCreationApi.remove(id);
      Swal.fire("Deleted!", "User removed.", "success");
      fetchUsers();
    } catch (err) {
      Swal.fire("Error", "Unable to delete user", "error");
    }
  };

  const handleStatusToggle = async (id: string | number, value: boolean) => {
    try {
      await userCreationApi.update(id, {
        is_active: value,
      });
      fetchUsers();
    } catch (err: any) {
      console.error("Status update error:", err?.response?.data || err);
      Swal.fire("Update failed", "Unable to change status", "error");
    }
  };

  /* ---------------- SEARCH ---------------- */
  const onSearch = (e: any) => {
    const val = e.target.value;
    setFilters({ global: { value: val, matchMode: FilterMatchMode.CONTAINS } });
    setGlobalFilter(val);
  };

  const searchBar = (
    <div className="flex justify-end p-2">
      <div className="flex items-center gap-2 px-3 py-1 border rounded bg-white">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilter}
          onChange={onSearch}
          placeholder="Search..."
          className="border-0 shadow-none"
        />
      </div>
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="p-3">
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 text-sm">Manage system users</p>
        </div>

        <Button
          label="Add User"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW)}
        />
      </div>

      <DataTable
        value={users}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        filters={filters}
        globalFilterFields={["username", "email", "first_name", "last_name"]}
        header={searchBar}
        stripedRows
        showGridlines
        className="p-datatable-sm mt-4"
      >
        <Column header="S.No" body={(_, o) => o.rowIndex + 1} />
        <Column header="Username" field="username" />
        <Column header="Name" body={(r) => buildFullName(r) || "—"} />
        <Column header="Email" field="email" />
        <Column
          header="Staff"
          body={(r) => (r.is_staff ? "Yes" : "No")}
        />
        <Column
          header="Status"
          body={(r) => (
            <Switch
              checked={!!r.is_active}
              onCheckedChange={(v) => handleStatusToggle(r.id, v)}
            />
          )}
        />
        <Column
          header="Actions"
          body={(r) => (
            <div className="flex gap-3">
              <PencilIcon onClick={() => navigate(ENC_EDIT(r.id))} />
              <TrashBinIcon
                className="text-red-500"
                onClick={() => handleDelete(r.id)}
              />
            </div>
          )}
        />
      </DataTable>
    </div>
  );
}