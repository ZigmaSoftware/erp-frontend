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

import type { UserCreation } from "../types/admin.types";
import { userCreationApi } from "@/helpers/admin";

export default function UserCreationList() {
  const [users, setUsers] = useState<UserCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    username: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encAdmins, encUserCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encAdmins}/${encUserCreation}/new`;
  const ENC_EDIT_PATH = (id: string | number) =>
    `/${encAdmins}/${encUserCreation}/${id}/edit`;

  /* ---------------- FETCH ---------------- */
  const fetchUsers = async () => {
    try {
      const res = await userCreationApi.list();
      console.log(res);
      const payload: any = res;

      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : payload.data?.results ?? [];

      console.log(data);

      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id: string | number) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await userCreationApi.remove(id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchUsers();
  };

  /* ---------------- STATUS ---------------- */
  const statusTemplate = (row: any) => {
    const updateStatus = async (value: boolean) => {
      await userCreationApi.update(row.id, {
        username: row.username,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        is_active: value,
      });

      fetchUsers();
    };

    return (
      <Switch
        checked={!!row.is_active}
        onCheckedChange={updateStatus}
      />
    );
  };

  /* ---------------- SEARCH ---------------- */
  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  /* ---------------- TEMPLATES ---------------- */
  const indexTemplate = (_: UserCreation, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const fullNameTemplate = (row: UserCreation) =>
    [row.first_name, row.last_name].filter(Boolean).join(" ") || "—";

  const actionTemplate = (row: any) => (
    <div className="flex gap-2 justify-center">
      <button
        title="Edit"
        className="text-blue-600 hover:text-blue-800"
        onClick={() => navigate(ENC_EDIT_PATH(row.id))}
      >
        <PencilIcon className="size-5" />
      </button>

      <button
        title="Delete"
        className="text-red-600 hover:text-red-800"
        onClick={() => handleDelete(row.id)}
      >
        <TrashBinIcon className="size-5" />
      </button>
    </div>
  );

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search users..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="px-3 py-3 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            User Management
          </h1>
          <p className="text-gray-500 text-sm">
            Manage your system users
          </p>
        </div>

        <Button
          label="Add User"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={() => navigate(ENC_NEW_PATH)}
        />
      </div>

      <DataTable
        value={users}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={[
          "username",
          "email",
          "first_name",
          "last_name",
        ]}
        header={header}
        emptyMessage="No users found."
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
          field="username"
          header="Username"
          sortable
          style={{ minWidth: "150px" }}
        />

        <Column
          header="Name"
          body={fullNameTemplate}
          style={{ minWidth: "200px" }}
        />

        <Column
          field="email"
          header="Email"
          sortable
          style={{ minWidth: "220px" }}
        />

        <Column
          header="Staff"
          body={(row: any) => (row.is_staff ? "Yes" : "No")}
          style={{ width: "100px" }}
        />

        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px" }}
        />

        <Column
          header="Actions"
          body={actionTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );
}
