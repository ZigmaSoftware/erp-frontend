import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  customerDestinationApi,
  customerItemPurposeApi,
  itemCreationApi,
} from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  CustomerCreation,
  CustomerDestination,
  CustomerItemPurpose,
} from "../types/salesMasters.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

const todayValue = () => new Date().toISOString().slice(0, 10);

const DISPOSAL_TYPE_OPTIONS: Option[] = [
  { value: "customer_scope", label: "Customer Scope" },
  { value: "zigma_scope", label: "Zigma Scope" },
  { value: "transport_scope", label: "Transport Scope" },
];

const PURPOSE_APPLICATION_OPTIONS: Option[] = [
  { value: "land_fill_earth_fill", label: "Land Fill / Earth Fill" },
];

export default function CustomerItemPurposeModal({
  customer,
  open,
  onClose,
}: {
  customer: CustomerCreation | null;
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<CustomerItemPurpose[]>([]);
  const [destinations, setDestinations] = useState<CustomerDestination[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [rowSite, setRowSite] = useState("");
  const [rowDestination, setRowDestination] = useState("");
  const [rowItem, setRowItem] = useState("");
  const [rowDisposalType, setRowDisposalType] = useState("");
  const [rowPurposeApplication, setRowPurposeApplication] = useState("");
  const [rowStatus, setRowStatus] = useState<"active" | "inactive">("active");

  const siteOptions: Option[] = useMemo(() => {
    if (!customer) return [];
    const names = customer.site_names ?? [];
    const ids = customer.sites ?? [];
    return ids.map((id, index) => ({
      value: id,
      label: names[index] ?? id,
    }));
  }, [customer]);

  const destinationOptions: Option[] = useMemo(
    () =>
      toOptions(
        destinations.filter((d) => d.site === rowSite),
        (d) => d.destination,
        (d) => d.destination,
      ),
    [destinations, rowSite],
  );

  const itemOptions: Option[] = useMemo(
    () => toOptions(items, (i) => i.unique_id, (i) => i.item_name),
    [items],
  );

  const loadData = async (customerId: string) => {
    setLoading(true);
    try {
      const [itemPurposeRes, destinationRes, itemRes] = await Promise.all([
        customerItemPurposeApi.list({ params: { customer: customerId } }),
        customerDestinationApi.list({ params: { customer: customerId } }),
        itemCreationApi.list(),
      ]);
      setRows(itemPurposeRes as CustomerItemPurpose[]);
      setDestinations(destinationRes as CustomerDestination[]);
      setItems(itemRes as unknown[]);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed to load item/purpose entries",
        text: "Something went wrong!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer) {
      loadData(customer.unique_id);
      resetRow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  const resetRow = () => {
    setEditingId("");
    setRowSite("");
    setRowDestination("");
    setRowItem("");
    setRowDisposalType("");
    setRowPurposeApplication("");
    setRowStatus("active");
  };

  const handleEdit = (row: CustomerItemPurpose) => {
    setEditingId(row.unique_id);
    setRowSite(row.site);
    setRowDestination(row.destination);
    setRowItem(row.item);
    setRowDisposalType(row.disposal_type);
    setRowPurposeApplication(row.purpose_application);
    setRowStatus(row.status);
  };

  const handleDelete = async (row: CustomerItemPurpose) => {
    if (!customer) return;
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This row will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      await customerItemPurposeApi.remove(row.unique_id);
      await loadData(customer.unique_id);
      if (editingId === row.unique_id) resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    }
  };

  const handleAdd = async () => {
    if (!customer) return;
    if (!rowSite || !rowDestination || !rowItem || !rowDisposalType || !rowPurposeApplication) {
      Swal.fire({ icon: "error", title: "All fields are required" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer: customer.unique_id,
        site: rowSite,
        destination: rowDestination,
        item: rowItem,
        disposal_type: rowDisposalType,
        purpose_application: rowPurposeApplication,
        status: rowStatus,
      };

      if (editingId) {
        await customerItemPurposeApi.update(editingId, payload);
      } else {
        await customerItemPurposeApi.create(payload);
      }

      await loadData(customer.unique_id);
      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editingId ? "Update failed" : "Add failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const isRowDisabled = loading || saving;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Item Purpose-Application</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Customer Name: </span>
            <span className="font-medium">{customer?.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-500">Site Name: </span>
            <span className="font-medium">
              {(customer?.site_names ?? []).join(", ") || "-"}
            </span>
          </div>
        </div>

        {destinations.length === 0 && !loading && (
          <p className="text-sm text-amber-600">
            Add at least one destination for this customer before adding items.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left w-10">#</th>
                <th className="border px-3 py-2 text-left">Entry Date</th>
                <th className="border px-3 py-2 text-left">Site Name</th>
                <th className="border px-3 py-2 text-left">Destination</th>
                <th className="border px-3 py-2 text-left">Item Name</th>
                <th className="border px-3 py-2 text-left">Disposal Type</th>
                <th className="border px-3 py-2 text-left">Purpose-Application</th>
                <th className="border px-3 py-2 text-left">Status</th>
                <th className="border px-3 py-2 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 text-gray-400">#</td>
                <td className="border px-3 py-2 text-gray-500 whitespace-nowrap">
                  {todayValue()}
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowSite || undefined}
                    onValueChange={(value) => {
                      setRowSite(value);
                      setRowDestination("");
                    }}
                    disabled={isRowDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {siteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowDestination || undefined}
                    onValueChange={setRowDestination}
                    disabled={isRowDisabled || !rowSite}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Select value={rowItem || undefined} onValueChange={setRowItem} disabled={isRowDisabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowDisposalType || undefined}
                    onValueChange={setRowDisposalType}
                    disabled={isRowDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISPOSAL_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowPurposeApplication || undefined}
                    onValueChange={setRowPurposeApplication}
                    disabled={isRowDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURPOSE_APPLICATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowStatus}
                    onValueChange={(value) => setRowStatus(value as "active" | "inactive")}
                    disabled={isRowDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2 text-center">
                  <div className="flex gap-2 justify-center">
                    <Button type="button" onClick={handleAdd} disabled={isRowDisabled} className="h-8 px-3">
                      {saving ? "..." : editingId ? "Update" : "Add"}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={resetRow}
                        disabled={isRowDisabled}
                        className="h-8 px-3"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>

              {rows.map((row, index) => (
                <tr key={row.unique_id}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">
                    {new Date(row.created_at ?? "").toLocaleDateString("en-GB")}
                  </td>
                  <td className="border px-3 py-2">{row.site_name ?? "-"}</td>
                  <td className="border px-3 py-2">{row.destination}</td>
                  <td className="border px-3 py-2">{row.item_name ?? "-"}</td>
                  <td className="border px-3 py-2">
                    {DISPOSAL_TYPE_OPTIONS.find((o) => o.value === row.disposal_type)?.label ?? row.disposal_type}
                  </td>
                  <td className="border px-3 py-2">
                    {PURPOSE_APPLICATION_OPTIONS.find((o) => o.value === row.purpose_application)?.label ??
                      row.purpose_application}
                  </td>
                  <td className="border px-3 py-2 capitalize">{row.status}</td>
                  <td className="border px-3 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="border px-3 py-4 text-center text-gray-400">
                    No items added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
