import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { payableApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { Payable, PayableSub } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export default function PayableForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encPayable } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encPayable}`;

  /* ---------------- Header state ---------------- */
  const [entryDate, setEntryDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [description, setDescription] = useState("");

  /* ---------------- Sub-items ---------------- */
  const [items, setItems] = useState<PayableSub[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");
  const [rowItemName, setRowItemName] = useState("");
  const [rowDescription, setRowDescription] = useState("");
  const [rowQty, setRowQty] = useState("");
  const [rowRate, setRowRate] = useState("");
  const [rowAmount, setRowAmount] = useState("");
  const [rowTax, setRowTax] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList, customerList] = await Promise.all([
          siteApi.list(),
          customerCreationApi.list(),
        ]);
        setSites(siteList as unknown[]);
        setCustomers(customerList as unknown[]);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load dropdown options",
          text: "Something went wrong!",
        });
      }
    };

    loadOptions();
  }, []);

  const siteOptions = useMemo(
    () => toOptions(sites, (s) => s.unique_id, (s) => s.site_name),
    [sites],
  );

  const supplierOptions = useMemo(
    () => toOptions(customers, (c) => c.unique_id, (c) => c.customer_name),
    [customers],
  );

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await payableApi.get(id as string);
        const data = (res?.data || res) as Payable;

        setEntryDate(data.entry_date ?? "");
        setSupplierName(data.supplier_name ?? "");
        setSiteId(data.site_id ?? "");
        setWorkOrderNo(data.work_order_no ?? "");
        setDescription(data.description ?? "");
        setItems(data.sub_items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load payable",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      entry_date: entryDate,
      supplier_name: supplierName,
      site_id: siteId,
      work_order_no: workOrderNo.trim(),
      description: description.trim() || null,
    };

    try {
      if (isEdit) {
        await payableApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await payableApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.payable_no?.[0] ||
        error?.response?.data?.supplier_name?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save payable.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------
     SUB-ITEM ROW HANDLERS
  ----------------------------------------------------------- */
  const resetRow = () => {
    setRowItemName("");
    setRowDescription("");
    setRowQty("");
    setRowRate("");
    setRowAmount("");
    setRowTax("");
    setEditingItemId("");
  };

  const handleAddRow = async () => {
    if (!rowItemName) {
      Swal.fire({ icon: "error", title: "Item Name is required" });
      return;
    }

    setSavingRow(true);
    try {
      const payload = {
        payable_entry: id as string,
        item_name: rowItemName.trim(),
        description: rowDescription.trim(),
        qty: rowQty || "0",
        rate: rowRate || "0",
        amount: rowAmount || "0",
        tax_per: rowTax || "0",
      };

      if (editingItemId) {
        await payableApi.update(editingItemId, payload);
      } else {
        await payableApi.create(payload);
      }

      const res = await payableApi.get(id as string);
      const data = (res?.data || res) as Payable;
      setItems(data.sub_items ?? []);
      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editingItemId ? "Update failed" : "Add failed",
        text: "Something went wrong!",
      });
    } finally {
      setSavingRow(false);
    }
  };

  const handleEditRow = (item: PayableSub) => {
    setEditingItemId(item.unique_id);
    setRowItemName(item.item_name);
    setRowDescription(item.description);
    setRowQty(String(item.qty ?? ""));
    setRowRate(String(item.rate ?? ""));
    setRowAmount(String(item.amount ?? ""));
    setRowTax(String(item.tax_per ?? ""));
  };

  const handleDeleteRow = async (item: PayableSub) => {
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
      await payableApi.remove(item.unique_id);
      if (id) {
        const res = await payableApi.get(id as string);
        const data = (res?.data || res) as Payable;
        setItems(data.sub_items ?? []);
      }
      if (editingItemId === item.unique_id) resetRow();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Something went wrong!",
      });
    }
  };

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          qty: acc.qty + toNumber(item.qty),
          amount: acc.amount + toNumber(item.amount),
        }),
        { qty: 0, amount: 0 },
      ),
    [items],
  );

  const isFormDisabled = fetching || loading;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Payable" : "Add New Payable"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Entry Date *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Supplier *</Label>
              <Select
                value={supplierName}
                onValueChange={setSupplierName}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {supplierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Site *</Label>
              <Select
                value={siteId}
                onValueChange={setSiteId}
                disabled={isFormDisabled}
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
            </div>

            <div>
              <Label>Work Order No</Label>
              <Input
                value={workOrderNo}
                onChange={(e) => setWorkOrderNo(e.target.value)}
                placeholder="Work Order No"
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                disabled={isFormDisabled}
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-3">Payable Items</h3>
            <table className="w-full border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left w-12">S.No</th>
                  <th className="border px-3 py-2 text-left">Item Name *</th>
                  <th className="border px-3 py-2 text-left">Description</th>
                  <th className="border px-3 py-2 text-right">Qty</th>
                  <th className="border px-3 py-2 text-right">Rate</th>
                  <th className="border px-3 py-2 text-right">Amount</th>
                  <th className="border px-3 py-2 text-right">Tax (%)</th>
                  <th className="border px-3 py-2 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.unique_id}>
                    <td className="border px-3 py-2">{index + 1}</td>
                    <td className="border px-3 py-2">{item.item_name}</td>
                    <td className="border px-3 py-2">{item.description}</td>
                    <td className="border px-3 py-2 text-right">{item.qty}</td>
                    <td className="border px-3 py-2 text-right">{item.rate}</td>
                    <td className="border px-3 py-2 text-right">{item.amount}</td>
                    <td className="border px-3 py-2 text-right">{item.tax_per}</td>
                    <td className="border px-3 py-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          title="Edit"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEditRow(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteRow(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td className="border px-3 py-2">#</td>
                  <td className="border px-3 py-2">
                    <Input
                      value={rowItemName}
                      onChange={(e) => setRowItemName(e.target.value)}
                      placeholder="Item Name"
                      disabled={isRowDisabled}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      value={rowDescription}
                      onChange={(e) => setRowDescription(e.target.value)}
                      placeholder="Description"
                      disabled={isRowDisabled}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowQty}
                      onChange={(e) => setRowQty(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowRate}
                      onChange={(e) => setRowRate(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowAmount}
                      onChange={(e) => setRowAmount(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={rowTax}
                      onChange={(e) => setRowTax(e.target.value)}
                      disabled={isRowDisabled}
                      className="text-right"
                    />
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        onClick={handleAddRow}
                        disabled={isRowDisabled}
                        className="h-8 px-3"
                      >
                        {savingRow ? "..." : editingItemId ? "UPDATE" : "ADD"}
                      </Button>
                      {editingItemId && (
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
              </tbody>
              <tfoot>
                <tr className="font-semibold bg-gray-50">
                  <td className="border px-3 py-2" colSpan={3}>
                    Total
                  </td>
                  <td className="border px-3 py-2 text-right">{totals.qty}</td>
                  <td className="border px-3 py-2" />
                  <td className="border px-3 py-2 text-right">{totals.amount}</td>
                  <td className="border px-3 py-2" />
                  <td className="border px-3 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate(ENC_LIST_PATH)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
