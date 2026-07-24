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

import { aggregateComparisonApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  AggregateComparison,
  AggregateComparisonSub,
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

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function AggregateComparisonForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encAggregateComparison } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encAggregateComparison}`;

  /* ---------------- Header state ---------------- */
  const [quoteMonth, setQuoteMonth] = useState(currentMonthValue());
  const [siteId, setSiteId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");

  /* ---------------- Sublist state ---------------- */
  const [items, setItems] = useState<AggregateComparisonSub[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");

  const [rowQuoteEntryNo, setRowQuoteEntryNo] = useState("");
  const [rowMaterialId, setRowMaterialId] = useState("");
  const [rowCustomerName, setRowCustomerName] = useState("");
  const [rowQuoteAmount, setRowQuoteAmount] = useState("");
  const [rowQuoteCheckList, setRowQuoteCheckList] = useState(false);
  const [rowRemarks, setRowRemarks] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const siteList = await siteApi.list();
        setSites(siteList as unknown[]);
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

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await aggregateComparisonApi.get(id as string);
        const data = (res?.data || res) as AggregateComparison;

        setQuoteMonth((data.quote_month ?? currentMonthValue()).slice(0, 7));
        setSiteId(data.site_id ?? "");
        setDescription(data.comp_description ?? "");
        setStatus(data.status ?? "pending");
        setItems(data.sub_items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load aggregate comparison",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  const persistHeaderField = async (field: string, value: string) => {
    if (!id) return;
    try {
      setSavingHeader(true);
      await aggregateComparisonApi.update(id, {
        [field]: field === "quote_month" ? `${value}-01` : value,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to update comparison",
        text: extractErrorMessage(error),
      });
    } finally {
      setSavingHeader(false);
    }
  };

  const handleSiteChange = (value: string) => {
    setSiteId(value);
    if (isEdit) persistHeaderField("site_id", value);
  };

  const handleMonthChange = (value: string) => {
    setQuoteMonth(value);
    if (isEdit) persistHeaderField("quote_month", value);
  };

  const handleAddRow = async () => {
    if (!siteId) {
      Swal.fire({ icon: "error", title: "Site is required" });
      return;
    }

    setSavingRow(true);
    try {
      let headerId = id;

      if (!headerId) {
        const headerRes = await aggregateComparisonApi.create({
          quote_month: `${quoteMonth}-01`,
          site_id: siteId,
          comp_description: description.trim(),
          status,
        });
        const headerData = (headerRes?.data || headerRes) as AggregateComparison;
        headerId = headerData.unique_id;
        navigate(`/${encSalesService}/${encAggregateComparison}/${headerId}/edit`, { replace: true });
      }

      const payload = {
        comparison: headerId,
        quote_entry_no: rowQuoteEntryNo.trim(),
        material_id: rowMaterialId.trim() || null,
        customer_name: rowCustomerName.trim(),
        quote_amount: rowQuoteAmount || "0",
        quote_check_list: rowQuoteCheckList,
        remarks: rowRemarks.trim() || null,
      };

      if (editingItemId) {
        await aggregateComparisonApi.update(editingItemId, payload);
      } else {
        await aggregateComparisonApi.create(payload);
      }

      if (headerId) {
        const res = await aggregateComparisonApi.get(headerId);
        const data = (res?.data || res) as AggregateComparison;
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

  const handleEditRow = (item: AggregateComparisonSub) => {
    setEditingItemId(item.unique_id);
    setRowQuoteEntryNo(item.quote_entry_no);
    setRowMaterialId(item.material_id ?? "");
    setRowCustomerName(item.customer_name);
    setRowQuoteAmount(String(item.quote_amount ?? ""));
    setRowQuoteCheckList(item.quote_check_list);
    setRowRemarks(item.remarks ?? "");
  };

  const handleDeleteRow = async (item: AggregateComparisonSub) => {
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
      await aggregateComparisonApi.remove(item.unique_id);
      if (id) {
        const res = await aggregateComparisonApi.get(id);
        const data = (res?.data || res) as AggregateComparison;
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
    setRowQuoteEntryNo("");
    setRowMaterialId("");
    setRowCustomerName("");
    setRowQuoteAmount("");
    setRowQuoteCheckList(false);
    setRowRemarks("");
    setEditingItemId("");
  };

  const isFormDisabled = fetching || savingHeader;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Aggregate Comparison" : "Add New Aggregate Comparison"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Quote Month *</Label>
            <Input
              type="month"
              value={quoteMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={isFormDisabled}
              required
            />
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
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                if (isEdit) persistHeaderField("status", value);
              }}
              disabled={isFormDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
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
                <th className="border px-3 py-2 text-left">Quote Entry No *</th>
                <th className="border px-3 py-2 text-left">Material ID</th>
                <th className="border px-3 py-2 text-left">Customer Name</th>
                <th className="border px-3 py-2 text-right">Quote Amount</th>
                <th className="border px-3 py-2 text-center">Check</th>
                <th className="border px-3 py-2 text-left">Remarks</th>
                <th className="border px-3 py-2 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.unique_id}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{item.quote_entry_no}</td>
                  <td className="border px-3 py-2">{item.material_id ?? "-"}</td>
                  <td className="border px-3 py-2">{item.customer_name}</td>
                  <td className="border px-3 py-2 text-right">{item.quote_amount}</td>
                  <td className="border px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.quote_check_list}
                      readOnly
                    />
                  </td>
                  <td className="border px-3 py-2">{item.remarks ?? "-"}</td>
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
                    value={rowQuoteEntryNo}
                    onChange={(e) => setRowQuoteEntryNo(e.target.value)}
                    placeholder="Quote Entry No"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    value={rowMaterialId}
                    onChange={(e) => setRowMaterialId(e.target.value)}
                    placeholder="Material ID"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    value={rowCustomerName}
                    onChange={(e) => setRowCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowQuoteAmount}
                    onChange={(e) => setRowQuoteAmount(e.target.value)}
                    disabled={isRowDisabled}
                    className="text-right"
                  />
                </td>
                <td className="border px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={rowQuoteCheckList}
                    onChange={(e) => setRowQuoteCheckList(e.target.checked)}
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    value={rowRemarks}
                    onChange={(e) => setRowRemarks(e.target.value)}
                    placeholder="Remarks"
                    disabled={isRowDisabled}
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
