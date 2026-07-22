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
import { itemCreationServiceApi } from "@/helpers/admin";
import type { ItemCreation } from "../types/salesService.types";

export default function ItemCreationList() {
  const [items, setItems] = useState<ItemCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    item_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesService, encItemCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encItemCreation}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encItemCreation}/${unique_id}/edit`;

  const fetchItems = async () => {
    try {
      const res = await itemCreationServiceApi.list();
      const payload: any = res;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : (payload.data?.results ?? []);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This item will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await itemCreationServiceApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchItems();
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: ItemCreation, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const actionTemplate = (row: ItemCreation) => (
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

  const statusTemplate = (row: ItemCreation) => {
    const updateStatus = async (value: boolean) => {
      await itemCreationServiceApi.update(row.unique_id, {
        item_type_id: row.item_type_id,
        category_id: row.category_id,
        site_id: row.site_id,
        item_name: row.item_name,
        purpose_application: row.purpose_application,
        description: row.description,
        is_active: value,
      });

      fetchItems();
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
          placeholder="Search items..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 py-3 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Item Creation
          </h1>
          <p className="text-gray-500 text-sm">
            Manage item records
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
        value={items}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={[
          "item_type_name",
          "category_name",
          "item_name",
          "item_code",
        ]}
        header={header}
        emptyMessage="No items found."
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
          field="item_type_name"
          header="Item Type"
          sortable
          style={{ minWidth: "140px" }}
        />
        <Column
          field="category_name"
          header="Category Name"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          field="item_name"
          header="Item Name"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          field="item_code"
          header="Item Code"
          sortable
          style={{ minWidth: "120px" }}
        />
        <Column
          field="purpose_application"
          header="Purpose Application"
          style={{ minWidth: "180px" }}
        />
        <Column
          field="description"
          header="Description"
          style={{ minWidth: "200px" }}
        />
        <Column
          header="Status"
          body={statusTemplate}
          style={{ width: "150px" }}
        />
        <Column
          header="Action"
          body={actionTemplate}
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );
}
