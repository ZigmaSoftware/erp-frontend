import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Eye } from "lucide-react";

import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PencilIcon, TrashBinIcon } from "@/icons";
import { getEncryptedRoute } from "@/utils/routeCache";
import { icwSupplierCreationApi } from "@/helpers/admin";
import type { IcwSupplierCreation } from "../types/salesMasters.types";

const partyTypeLabel = (value: IcwSupplierCreation["party_type"]) =>
  value === "creditor" ? "Creditor" : "Debitor";

const yesNoLabel = (value: boolean) => (value ? "Yes" : "No");

export default function IcwSupplierCreationList() {
  const [suppliers, setSuppliers] = useState<IcwSupplierCreation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSupplier, setViewSupplier] = useState<IcwSupplierCreation | null>(null);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  const navigate = useNavigate();
  const { encSalesMasters, encIcwSupplierCreation } = getEncryptedRoute();

  const ENC_NEW_PATH = `/${encSalesMasters}/${encIcwSupplierCreation}/new`;
  const ENC_EDIT_PATH = (uniqueId: string) =>
    `/${encSalesMasters}/${encIcwSupplierCreation}/${uniqueId}/edit`;

  const fetchSuppliers = async () => {
    try {
      const res = (await icwSupplierCreationApi.list()) as IcwSupplierCreation[];
      setSuppliers(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (uniqueId: string) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This ICW supplier will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    await icwSupplierCreationApi.remove(uniqueId);

    Swal.fire({
      icon: "success",
      title: "Deleted successfully!",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchSuppliers();
  };

  const onGlobalFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }));
    setGlobalFilterValue(value);
  };

  const indexTemplate = (_: IcwSupplierCreation, { rowIndex }: { rowIndex: number }) =>
    rowIndex + 1;

  const siteNamesTemplate = (row: IcwSupplierCreation) =>
    row.site_names && row.site_names.length > 0 ? row.site_names.join(", ") : "-";

  const customerStatusTemplate = (row: IcwSupplierCreation) =>
    row.is_active ? (
      <span className="inline-flex min-w-5 justify-center rounded border border-red-500 px-1 text-sm font-semibold text-red-600">
        P
      </span>
    ) : (
      "-"
    );

  const viewTemplate = (row: IcwSupplierCreation) => (
    <div className="flex justify-center">
      <button
        title="View supplier"
        className="text-gray-700 hover:text-emerald-700"
        onClick={() => setViewSupplier(row)}
      >
        <Eye className="size-5" />
      </button>
    </div>
  );

  const actionTemplate = (row: IcwSupplierCreation) => (
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
          placeholder="Search ICW suppliers..."
          className="p-inputtext-sm !border-0 !shadow-none"
        />
      </div>
    </div>
  );

  const detail = viewSupplier;

  return (
    <div className="px-3 py-3 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            ICW Supplier Creation
          </h1>
          <p className="text-gray-500 text-sm">
            Manage ICW supplier customer and bank details
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
        value={suppliers}
        paginator
        rows={10}
        loading={loading}
        filters={filters}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilterFields={[
          "customer_name",
          "contact_person",
          "mobile_no",
          "site_names",
          "customer_id",
        ]}
        header={header}
        emptyMessage="No ICW suppliers found."
        stripedRows
        showGridlines
        className="p-datatable-sm"
      >
        <Column header="S.No" body={indexTemplate} style={{ width: "80px" }} />
        <Column
          header="Party Type"
          body={(row: IcwSupplierCreation) => partyTypeLabel(row.party_type)}
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          field="customer_id"
          header="Customer Id"
          sortable
          style={{ minWidth: "130px" }}
        />
        <Column
          field="customer_name"
          header="Customer Name"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          field="contact_person"
          header="Contact Person"
          sortable
          style={{ minWidth: "180px" }}
        />
        <Column
          header="Site name"
          body={siteNamesTemplate}
          sortable
          style={{ minWidth: "260px" }}
        />
        <Column
          field="mobile_no"
          header="Mobile No"
          style={{ minWidth: "140px" }}
        />
        <Column
          field="opening_balance"
          header="Opening Balance"
          style={{ minWidth: "170px", textAlign: "right" }}
        />
        <Column
          header="NOC Upload Status"
          body={(row: IcwSupplierCreation) => yesNoLabel(row.noc_upload_status)}
          style={{ minWidth: "170px" }}
        />
        <Column
          header="Customer Status"
          body={customerStatusTemplate}
          style={{ width: "150px", textAlign: "center" }}
        />
        <Column header="View" body={viewTemplate} style={{ width: "100px" }} />
        <Column header="Action" body={actionTemplate} style={{ width: "130px" }} />
      </DataTable>

      <Dialog
        header={detail?.customer_name ?? "ICW Supplier"}
        visible={Boolean(detail)}
        style={{ width: "70vw", maxWidth: "900px" }}
        modal
        onHide={() => setViewSupplier(null)}
      >
        {detail && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Party Type:</strong> {partyTypeLabel(detail.party_type)}</div>
            <div><strong>Customer Id:</strong> {detail.customer_id ?? "-"}</div>
            <div><strong>Contact Person:</strong> {detail.contact_person}</div>
            <div><strong>Mobile No:</strong> {detail.mobile_no}</div>
            <div><strong>Site:</strong> {siteNamesTemplate(detail)}</div>
            <div><strong>NOC Upload Status:</strong> {yesNoLabel(detail.noc_upload_status)}</div>
            <div><strong>Bank Name:</strong> {detail.bank_name || "-"}</div>
            <div><strong>Branch:</strong> {detail.branch || "-"}</div>
            <div><strong>Account No:</strong> {detail.account_no || "-"}</div>
            <div><strong>IFSC Code:</strong> {detail.ifsc_code || "-"}</div>
            <div><strong>PAN No:</strong> {detail.pan_no || "-"}</div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
