import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { dailyTargetApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  DailyTargetDisposal,
  DailyTargetDisposalSub,
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

const currentDateValue = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

export default function DailyTargetForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encDailyTarget } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encDailyTarget}`;

  /* ---------------- Header state ---------------- */
  const [siteId, setSiteId] = useState("");
  const [entryDate, setEntryDate] = useState(currentDateValue());

  /* ---------------- Sublist state ---------------- */
  const [items, setItems] = useState<DailyTargetDisposalSub[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");

  const [rowCustomerName, setRowCustomerName] = useState("");
  const [rowCustomerOrder, setRowCustomerOrder] = useState("");
  const [rowItemName, setRowItemName] = useState("");
  const [rowItemType, setRowItemType] = useState("");
  const [rowOrderQty, setRowOrderQty] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
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

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await dailyTargetApi.get(id as string);
        const data = (res?.data || res) as DailyTargetDisposal;

        setSiteId(data.site_id ?? "");
        setEntryDate((data.entry_date ?? currentDateValue()).slice(0, 10));
        setItems(data.sub_items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load daily target",
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
      await dailyTargetApi.update(id, { [field]: value });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to update daily target",
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

  const handleDateChange = (value: string) => {
    setEntryDate(value);
    if (isEdit) persistHeaderField("entry_date", value);
  };

  /* -----------------------------------------------------------
     ADD / UPDATE A SUBLIST ROW
  ----------------------------------------------------------- */
  const handleAddRow = async () => {
    if (!siteId) {
      Swal.fire({ icon: "error", title: "Site is required" });
      return;
    }

    setSavingRow(true);
    try {
      let headerId = id;

      if (!headerId) {
        const headerRes = await dailyTargetApi.create({
          site_id: siteId,
          entry_date: entryDate,
        });
        const headerData = (headerRes?.data || headerRes) as DailyTargetDisposal;
        headerId = headerData.unique_id;
        navigate(`/${encSalesService}/${encDailyTarget}/${headerId}/edit`, { replace: true });
      }

      const payload = {
        main: headerId,
        dte_customer_name: rowCustomerName,
        dte_customer_order: rowCustomerOrder,
        dte_item_name: rowItemName,
        dte_item_type: rowItemType,
        dte_order_qty: rowOrderQty || "0",
        dte_customer_order_qty: rowOrderQty || "0",
        dte_trans_order_no: "",
      };

      if (editingItemId) {
        await dailyTargetApi.update(editingItemId, payload);
      } else {
        await dailyTargetApi.create(payload);
      }

      if (headerId) {
        const res = await dailyTargetApi.get(headerId);
        const data = (res?.data || res) as DailyTargetDisposal;
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

  const handleEditRow = (item: DailyTargetDisposalSub) => {
    setEditingItemId(item.unique_id);
    setRowCustomerName(item.dte_customer_name);
    setRowCustomerOrder(item.dte_customer_order);
    setRowItemName(item.dte_item_name);
    setRowItemType(item.dte_item_type);
    setRowOrderQty(String(item.dte_order_qty ?? ""));
  };

  const handleDeleteRow = async (item: DailyTargetDisposalSub) => {
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
      await dailyTargetApi.remove(item.unique_id);
      if (id) {
        const res = await dailyTargetApi.get(id);
        const data = (res?.data || res) as DailyTargetDisposal;
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
    setRowCustomerName("");
    setRowCustomerOrder("");
    setRowItemName("");
    setRowItemType("");
    setRowOrderQty("");
    setEditingItemId("");
  };

  const isFormDisabled = fetching || savingHeader;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Daily Target" : "Add New Daily Target"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <Label>Entry Date *</Label>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={isFormDisabled}
              required
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left w-12">S.No</th>
                <th className="border px-3 py-2 text-left">Customer Name *</th>
                <th className="border px-3 py-2 text-left">Customer Order</th>
                <th className="border px-3 py-2 text-left">Item Name *</th>
                <th className="border px-3 py-2 text-left">Item Type</th>
                <th className="border px-3 py-2 text-right">Order Qty</th>
                <th className="border px-3 py-2 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.unique_id}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{item.dte_customer_name}</td>
                  <td className="border px-3 py-2">{item.dte_customer_order}</td>
                  <td className="border px-3 py-2">{item.dte_item_name}</td>
                  <td className="border px-3 py-2">{item.dte_item_type}</td>
                  <td className="border px-3 py-2 text-right">{item.dte_order_qty}</td>
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
                    value={rowCustomerName}
                    onChange={(e) => setRowCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    value={rowCustomerOrder}
                    onChange={(e) => setRowCustomerOrder(e.target.value)}
                    placeholder="Customer Order"
                    disabled={isRowDisabled}
                  />
                </td>
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
                    value={rowItemType}
                    onChange={(e) => setRowItemType(e.target.value)}
                    placeholder="Item Type"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowOrderQty}
                    onChange={(e) => setRowOrderQty(e.target.value)}
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
