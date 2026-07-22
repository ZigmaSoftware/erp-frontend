import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { MapPin, Target, CheckCircle2 } from "lucide-react";

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
import { customerCreationServiceApi } from "@/helpers/admin";
import type { CustomerCreation } from "../types/salesService.types";
import CustomerDestinationModal from "./customerDestinationModal";
import CustomerItemPurposeModal from "./customerItemPurposeModal";

export default function CustomerCreationList() {
  const [customers, setCustomers] = useState<CustomerCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const [destinationCustomer, setDestinationCustomer] = useState<CustomerCreation | null>(null);
  const [itemPurposeCustomer, setItemPurposeCustomer] = useState<CustomerCreation | null>(null);

  const navigate = useNavigate();
  const { encSalesService, encCustomerCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesService}/${encCustomerCreation}/new`;
  const ENC_EDIT_PATH = (unique_id: string) =>
    `/${encSalesService}/${encCustomerCreation}/${unique_id}/edit`;

  const fetchCustomers = async () => {
    try {
      const res = (await customerCreationServiceApi.list()) as CustomerCreation[];
      setCustomers(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (unique_id: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This customer (and all its destinations/items) will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await customerCreationServiceApi.remove(unique_id);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchCustomers();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: CustomerCreation, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const partyTypeTemplate = (row: CustomerCreation) =>
    row.customer_type === "creditor" ? "Creditor" : "Debitor";

  const siteNameTemplate = (row: CustomerCreation) =>
    (row.site_names ?? []).join(", ") || "-";

  const nocUploadTemplate = (row: CustomerCreation) => (row.noc_upload ? "Yes" : "No");

  const customerStatusTemplate = (row: CustomerCreation) =>
    row.noc_upload ? (
      <span
        title="Pending NOC review"
        className="inline-flex items-center justify-center rounded border border-red-400 text-red-600 font-bold text-xs w-6 h-6"
      >
        P
      </span>
    ) : (
      <CheckCircle2 className="text-green-600 size-5" />
    );

  const destinationTemplate = (row: CustomerCreation) =>
    row.noc_upload ? (
      <button
        title="Destinations"
        className="text-red-600 hover:text-red-800"
        onClick={() => setDestinationCustomer(row)}
      >
        <MapPin className="size-5" />
      </button>
    ) : null;

  const itemPurposeTemplate = (row: CustomerCreation) =>
    row.noc_upload ? (
      <button
        title="Item and Purpose"
        className="text-gray-600 hover:text-gray-900"
        onClick={() => setItemPurposeCustomer(row)}
      >
        <Target className="size-5" />
      </button>
    ) : null;

  const actionTemplate = (row: CustomerCreation) => (
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

  const header = (
    <div className="flex justify-end items-center">
      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-md border border-gray-300 shadow-sm">
        <i className="pi pi-search text-gray-500" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search customers..."
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
            Customer Creation
          </h1>
          <p className="text-gray-500 text-sm">
            Manage customer records
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
        value={customers}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={["customer_name", "contact_person", "mobile_no"]}
        header={header}
        emptyMessage="No customers found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "70px" }} />
        <Column header="Party Type" body={partyTypeTemplate} style={{ minWidth: "110px" }} />
        <Column
          field="customer_name"
          header="Cust Name"
          sortable
          style={{ minWidth: "200px" }}
        />
        <Column
          field="contact_person"
          header="Cont Person"
          style={{ minWidth: "160px" }}
        />
        <Column header="Site Name" body={siteNameTemplate} style={{ minWidth: "180px" }} />
        <Column field="mobile_no" header="Mob No" style={{ minWidth: "130px" }} />
        <Column
          field="opening_balance"
          header="Opening Balance"
          style={{ minWidth: "140px" }}
        />
        <Column header="NOC Upload Status" body={nocUploadTemplate} style={{ minWidth: "150px" }} />
        <Column header="Customer Status" body={customerStatusTemplate} style={{ width: "140px" }} />
        <Column header="Destination" body={destinationTemplate} style={{ width: "110px" }} />
        <Column header="Item And Purpose" body={itemPurposeTemplate} style={{ width: "130px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "110px" }} />
      </DataTable>

      <CustomerDestinationModal
        customer={destinationCustomer}
        open={Boolean(destinationCustomer)}
        onClose={() => setDestinationCustomer(null)}
      />
      <CustomerItemPurposeModal
        customer={itemPurposeCustomer}
        open={Boolean(itemPurposeCustomer)}
        onClose={() => setItemPurposeCustomer(null)}
      />
    </div>
  );
}
