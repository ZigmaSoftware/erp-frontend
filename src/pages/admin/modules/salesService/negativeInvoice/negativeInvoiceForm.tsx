import { useEffect, useMemo, useState } from "react";
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

import { negativeInvoiceApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  NegativeInvoice,
  NegativeInvoiceSub,
} from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function NegativeInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encNegativeInvoice } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encNegativeInvoice}`;

  /* ---------------- Header state ---------------- */
  const [dcNo, setDcNo] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [description, setDescription] = useState("");

  /* ---------------- Sublist state ---------------- */
  const [items, setItems] = useState<NegativeInvoiceSub[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");

  const [rowItemName, setRowItemName] = useState("");
  const [rowDescription, setRowDescription] = useState("");
  const [rowQty, setRowQty] = useState("");
  const [rowRate, setRowRate] = useState("");
  const [rowAmount, setRowAmount] = useState("");
  const [rowTaxPer, setRowTaxPer] = useState("");
  const [rowTaxAmount, setRowTaxAmount] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
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

  const customerOptions = useMemo(
    () => toOptions(customers, (c) => c.unique_id, (c) => c.customer_name),
    [customers],
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await negativeInvoiceApi.get(id as string);
        const data = (res?.data || res) as NegativeInvoice;

        setDcNo(data.dc_no ?? "");
        setEntryDate(data.entry_date ?? "");
        setCustomerName(data.customer_name ?? "");
        setSiteId(data.site_id ?? "");
        setWorkOrderNo(data.work_order_no ?? "");
        setDescription(data.description ?? "");
        setItems(data.sub_items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load negative invoice",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     HEADER FIELD CHANGES (auto-save once header exists)
  ----------------------------------------------------------- */
  const persistHeaderField = async (field: string, value: string) => {
    if (!id) return;
    try {
      setSavingHeader(true);
      await negativeInvoiceApi.update(id, { [field]: value });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to update invoice",
        text: extractErrorMessage(error),
      });
    } finally {
      setSavingHeader(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setCustomerName(value);
    if (isEdit) persistHeaderField("customer_name", value);
  };

  const handleSiteChange = (value: string) => {
    setSiteId(value);
    if (isEdit) persistHeaderField("site_id", value);
  };

  /* -----------------------------------------------------------
     ADD / UPDATE A SUBLIST ROW
  ----------------------------------------------------------- */
  const handleAddRow = async () => {
    if (!customerName.trim()) {
      Swal.fire({ icon: "error", title: "Customer is required" });
      return;
    }
    if (!siteId) {
      Swal.fire({ icon: "error", title: "Site is required" });
      return;
    }

    setSavingRow(true);
    try {
      let headerId = id;

      if (!headerId) {
        const headerRes = await negativeInvoiceApi.create({
          dc_no: dcNo.trim(),
          entry_date: entryDate,
          customer_name: customerName.trim(),
          site_id: siteId,
          work_order_no: workOrderNo.trim(),
          description: description.trim() || null,
        });
        const headerData = (headerRes?.data || headerRes) as NegativeInvoice;
        headerId = headerData.unique_id;
        navigate(`/${encSalesService}/${encNegativeInvoice}/${headerId}/edit`, { replace: true });
      }

      const payload = {
        main: headerId,
        item_name: rowItemName.trim(),
        description: rowDescription.trim(),
        qty: rowQty || "0",
        rate: rowRate || "0",
        amount: rowAmount || "0",
        tax_per: rowTaxPer || "0",
        tax_amount: rowTaxAmount || "0",
      };

      if (editingItemId) {
        await negativeInvoiceApi.update(editingItemId, payload);
      } else {
        await negativeInvoiceApi.create(payload);
      }

      if (headerId) {
        const res = await negativeInvoiceApi.get(headerId);
        const data = (res?.data || res) as NegativeInvoice;
        setItems(data.sub_items ?? []);
      }

      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editingItemId ? "Update failed" : "Add failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setSavingRow(false);
    }
  };

  const handleEditRow = (item: NegativeInvoiceSub) => {
    setEditingItemId(item.unique_id);
    setRowItemName(item.item_name);
    setRowDescription(item.description);
    setRowQty(String(item.qty ?? ""));
    setRowRate(String(item.rate ?? ""));
    setRowAmount(String(item.amount ?? ""));
    setRowTaxPer(String(item.tax_per ?? ""));
    setRowTaxAmount(String(item.tax_amount ?? ""));
  };

  const handleDeleteRow = async (item: NegativeInvoiceSub) => {
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
      await negativeInvoiceApi.remove(item.unique_id);
      if (id) {
        const res = await negativeInvoiceApi.get(id);
        const data = (res?.data || res) as NegativeInvoice;
        setItems(data.sub_items ?? []);
      }
      if (editingItemId === item.unique_id) resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    }
  };

  const resetRow = () => {
    setRowItemName("");
    setRowDescription("");
    setRowQty("");
    setRowRate("");
    setRowAmount("");
    setRowTaxPer("");
    setRowTaxAmount("");
    setEditingItemId("");
  };

  const isFormDisabled = fetching || savingHeader;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Negative Invoice" : "Add New Negative Invoice"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>DC No</Label>
            <Input
              value={dcNo}
              onChange={(e) => setDcNo(e.target.value)}
              placeholder="DC No"
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>Entry Date *</Label>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              disabled={isFormDisabled}
              required
            />
          </div>

          <div>
            <Label>Customer *</Label>
            <Select
              value={customerName}
              onValueChange={handleCustomerChange}
              disabled={isFormDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {customerOptions.map((option) => (
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
              onValueChange={handleSiteChange}
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
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left w-12">S.No</th>
                <th className="border px-3 py-2 text-left">Item Name *</th>
                <th className="border px-3 py-2 text-left">Description</th>
                <th className="border px-3 py-2 text-right">Qty</th>
                <th className="border px-3 py-2 text-right">Rate</th>
                <th className="border px-3 py-2 text-right">Amount</th>
                <th className="border px-3 py-2 text-right">Tax %</th>
                <th className="border px-3 py-2 text-right">Tax Amount</th>
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
                  <td className="border px-3 py-2 text-right">{item.tax_amount}</td>
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
                    value={rowTaxPer}
                    onChange={(e) => setRowTaxPer(e.target.value)}
                    disabled={isRowDisabled}
                    className="text-right"
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowTaxAmount}
                    onChange={(e) => setRowTaxAmount(e.target.value)}
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
          </table>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Button onClick={() => navigate(ENC_LIST_PATH)}>SUBMIT</Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </ComponentCard>
    </div>
  );
}
