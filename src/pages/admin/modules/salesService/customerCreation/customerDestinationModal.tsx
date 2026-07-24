import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { customerDestinationServiceApi, siteApi } from "@/helpers/admin";
import { extractErrorMessage } from "@/utils/errorUtils";
import { asRecord, pickFirstString } from "@/utils/formHelpers";
import type {
  CustomerCreation,
  CustomerDestination,
} from "../types/salesService.types";

type Option = { value: string; label: string };
type DraftCustomerDestination = CustomerDestination & { isDraft: true };

const todayValue = () => new Date().toISOString().slice(0, 10);
const createDraftId = () =>
  `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isDraftCustomerDestination = (
  row: CustomerDestination | DraftCustomerDestination,
): row is DraftCustomerDestination => "isDraft" in row;

export default function CustomerDestinationModal({
  customer,
  open,
  onClose,
}: {
  customer: CustomerCreation | null;
  open: boolean;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<CustomerDestination[]>([]);
  const [draftRows, setDraftRows] = useState<DraftCustomerDestination[]>([]);
  const [masterSites, setMasterSites] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [rowSite, setRowSite] = useState("");
  const [rowDestination, setRowDestination] = useState("");
  const [rowStatus, setRowStatus] = useState<"active" | "inactive">("active");
  const [fieldErrors, setFieldErrors] = useState({
    site: false,
    destination: false,
  });

  const masterSiteNameById = useMemo(() => {
    const map = new Map<string, string>();
    masterSites.forEach((site) => {
      const record = asRecord(site);
      if (!record) return;

      const id = pickFirstString(record.unique_id, record.id);
      const label = pickFirstString(record.site_name, record.name, record.label);
      if (id && label) map.set(id, label);
    });
    return map;
  }, [masterSites]);

  const siteOptions: Option[] = useMemo(() => {
    if (!customer) return [];
    const names = customer.site_names ?? [];
    const ids = customer.sites ?? [];
    return ids.map((id, index) => ({
      value: id,
      label: masterSiteNameById.get(id) ?? names[index] ?? id,
    }));
  }, [customer, masterSiteNameById]);

  const selectedSiteLabels = useMemo(
    () => siteOptions.map((option) => option.label).filter(Boolean),
    [siteOptions],
  );

  const getSiteLabel = (siteId?: string | null, fallback?: string | null) =>
    siteOptions.find((option) => option.value === siteId)?.label ||
    siteOptions.find((option) => option.value === fallback)?.label ||
    (siteId ? masterSiteNameById.get(siteId) : undefined) ||
    (fallback ? masterSiteNameById.get(fallback) : undefined) ||
    fallback ||
    siteId ||
    "-";

  const loadRows = async (customerId: string) => {
    setLoading(true);
    try {
      const [destinationRes, siteRes] = await Promise.all([
        customerDestinationServiceApi.list({
          params: { customer: customerId },
        }),
        siteApi.list(),
      ]);
      setRows(destinationRes as CustomerDestination[]);
      setMasterSites(siteRes as unknown[]);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed to load destinations",
        text: "Something went wrong!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer) {
      setDraftRows([]);
      loadRows(customer.unique_id);
      resetRow();
    }
  }, [open, customer]);

  const resetRow = () => {
    setEditingId("");
    setRowSite("");
    setRowDestination("");
    setRowStatus("active");
    setFieldErrors({ site: false, destination: false });
  };

  const handleEdit = (row: CustomerDestination | DraftCustomerDestination) => {
    setEditingId(row.unique_id);
    setRowSite(row.site);
    setRowDestination(row.destination);
    setRowStatus(row.status);
    setFieldErrors({ site: false, destination: false });
  };

  const handleDelete = async (row: CustomerDestination | DraftCustomerDestination) => {
    if (!customer) return;

    if (isDraftCustomerDestination(row)) {
      setDraftRows((prev) => prev.filter((item) => item.unique_id !== row.unique_id));
      if (editingId === row.unique_id) resetRow();
      return;
    }

    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This destination will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      await customerDestinationServiceApi.remove(row.unique_id);
      await loadRows(customer.unique_id);
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

    const nextFieldErrors = {
      site: !rowSite,
      destination: !rowDestination.trim(),
    };
    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.site || nextFieldErrors.destination) {
      return;
    }

    const payload = {
      customer: customer.unique_id,
      site: rowSite,
      destination: rowDestination.trim(),
      status: rowStatus,
    };

    if (editingId) {
      const draftMatch = draftRows.some((item) => item.unique_id === editingId);
      if (draftMatch) {
        setDraftRows((prev) =>
          prev.map((item) =>
            item.unique_id === editingId
              ? {
                  ...item,
                  ...payload,
                }
              : item,
          ),
        );
        resetRow();
        return;
      }

      setSaving(true);
      try {
        await customerDestinationServiceApi.update(editingId, payload);
        await loadRows(customer.unique_id);
        resetRow();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: extractErrorMessage(error),
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    setDraftRows((prev) => [
      ...prev,
      {
        unique_id: createDraftId(),
        is_active: true,
        created_at: new Date().toISOString(),
        customer: customer.unique_id,
        site: rowSite,
        destination: rowDestination.trim(),
        status: rowStatus,
        isDraft: true,
      },
    ]);
    resetRow();
  };

  const handleSubmit = async () => {
    if (!customer || draftRows.length === 0) return;

    setSubmitting(true);
    try {
      for (const row of draftRows) {
        await customerDestinationServiceApi.create({
          customer: customer.unique_id,
          site: row.site,
          destination: row.destination,
          status: row.status,
        });
      }

      await loadRows(customer.unique_id);
      setDraftRows([]);
      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submit failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isRowDisabled = loading || saving || submitting;
  const tableRows = [...draftRows, ...rows];

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Customer Destination</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Customer Name: </span>
            <span className="font-medium">{customer?.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-500">Site Name: </span>
            <span className="font-medium">
              {selectedSiteLabels.join(", ") || "-"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left w-10">#</th>
                <th className="border px-3 py-2 text-left">Entry Date</th>
                <th
                  className={`border px-3 py-2 text-left ${fieldErrors.site ? "text-red-600" : ""}`}
                >
                  Site Name *
                </th>
                <th
                  className={`border px-3 py-2 text-left ${fieldErrors.destination ? "text-red-600" : ""}`}
                >
                  Destination *
                </th>
                <th className="border px-3 py-2 text-left">Status</th>
                <th className="border px-3 py-2 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 text-gray-400">1</td>
                <td className="border px-3 py-2">
                  <Input value={todayValue()} disabled readOnly />
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowSite || undefined}
                    onValueChange={(value) => {
                      setRowSite(value);
                      setFieldErrors((prev) => ({ ...prev, site: false }));
                    }}
                    disabled={isRowDisabled}
                  >
                    <SelectTrigger
                      className={fieldErrors.site ? "border-red-500 text-red-600 focus:ring-red-500" : ""}
                    >
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
                  <Input
                    value={rowDestination}
                    onChange={(e) => {
                      setRowDestination(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, destination: false }));
                    }}
                    placeholder="Destination"
                    disabled={isRowDisabled}
                    className={
                      fieldErrors.destination
                        ? "border-red-500 text-red-600 placeholder:text-red-400 focus-visible:ring-red-500"
                        : ""
                    }
                  />
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

              {tableRows.map((row, index) => (
                <tr
                  key={row.unique_id}
                  className={isDraftCustomerDestination(row) ? "bg-amber-50" : ""}
                >
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">
                    {new Date(row.created_at ?? "").toLocaleDateString("en-GB")}
                  </td>
                  <td className="border px-3 py-2">
                    {getSiteLabel(row.site, row.site_name)}
                  </td>
                  <td className="border px-3 py-2">{row.destination}</td>
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

              {!loading && tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="border px-3 py-4 text-center text-gray-400">
                    No destinations added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <span className="text-sm text-gray-500">
            Pending: {draftRows.length}
          </span>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={draftRows.length === 0 || isRowDisabled}
            className="h-9 px-4"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
