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

import {
  targetEntryServiceApi,
  targetEntryItemServiceApi,
  siteApi,
  itemTypeServiceApi,
  subCategoryServiceApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  TargetEntry,
  TargetEntryItem,
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

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const currentMonthPrefix = () => {
  const now = new Date();
  return `TAR-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-`;
};

const computeNextTargetNo = (existingEntries: TargetEntry[]) => {
  const prefix = currentMonthPrefix();
  const maxSeq = existingEntries
    .map((entry) => entry.target_no)
    .filter((no): no is string => Boolean(no && no.startsWith(prefix)))
    .map((no) => parseInt(no.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
};

export default function TargetEntryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encTargetEntry } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encTargetEntry}`;

  /* ---------------- Header state ---------------- */
  const [targetEntryId, setTargetEntryId] = useState<string>("");
  const [targetNo, setTargetNo] = useState("");
  const [entryMonth, setEntryMonth] = useState(currentMonthValue());
  const [siteId, setSiteId] = useState("");

  /* ---------------- Sublist state ---------------- */
  const [items, setItems] = useState<TargetEntryItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");

  const [rowItemType, setRowItemType] = useState("");
  const [rowSubCategory, setRowSubCategory] = useState("");
  const [rowTargetQty, setRowTargetQty] = useState("");
  const [rowExpenseAmount, setRowExpenseAmount] = useState("");
  const [rowRevenueAmount, setRowRevenueAmount] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);
  const [itemTypes, setItemTypes] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList, itemTypeList, subCategoryList] = await Promise.all([
          siteApi.list(),
          itemTypeServiceApi.list(),
          subCategoryServiceApi.list(),
        ]);
        setSites(siteList as unknown[]);
        setItemTypes(itemTypeList as unknown[]);
        setSubCategories(subCategoryList as unknown[]);
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

  const itemTypeOptions = useMemo(
    () => toOptions(itemTypes, (t) => t.unique_id, (t) => t.item_type),
    [itemTypes],
  );

  const subCategoryOptions = useMemo(
    () =>
      toOptions(
        subCategories.filter((sc) => sc.item_type === rowItemType),
        (sc) => sc.unique_id,
        (sc) => sc.sub_category_name,
      ),
    [subCategories, rowItemType],
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await targetEntryServiceApi.get(id as string);
        const data = (res?.data || res) as TargetEntry;

        setTargetEntryId(data.unique_id);
        setTargetNo(data.target_no ?? "");
        setEntryMonth((data.entry_month ?? currentMonthValue()).slice(0, 7));
        setSiteId(data.site_id ?? "");
        setItems(data.items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load target entry",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     PREVIEW THE NEXT TARGET ENTRY NO (create mode only)
  ----------------------------------------------------------- */
  useEffect(() => {
    if (isEdit) return;

    const previewTargetNo = async () => {
      try {
        const res = (await targetEntryServiceApi.list()) as TargetEntry[];
        setTargetNo(computeNextTargetNo(res));
      } catch {
        // Non-fatal: the number is still confirmed by the backend on save.
      }
    };

    previewTargetNo();
  }, [isEdit]);

  /* -----------------------------------------------------------
     HEADER FIELD CHANGES (auto-save once header exists)
  ----------------------------------------------------------- */
  const persistHeaderField = async (field: "site_id" | "entry_month", value: string) => {
    if (!targetEntryId) return;
    try {
      setSavingHeader(true);
      await targetEntryServiceApi.update(targetEntryId, {
        [field]: field === "entry_month" ? `${value}-01` : value,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to update target entry",
        text: extractErrorMessage(error),
      });
    } finally {
      setSavingHeader(false);
    }
  };

  const handleSiteChange = (value: string) => {
    setSiteId(value);
    persistHeaderField("site_id", value);
  };

  const handleMonthChange = (value: string) => {
    setEntryMonth(value);
    persistHeaderField("entry_month", value);
  };

  /* -----------------------------------------------------------
     REFRESH ITEMS FROM SERVER
  ----------------------------------------------------------- */
  const refreshItems = async (headerId: string) => {
    const res = await targetEntryItemServiceApi.list({
      params: { target_entry: headerId },
    });
    setItems(res as TargetEntryItem[]);
  };

  const resetRow = () => {
    setRowItemType("");
    setRowSubCategory("");
    setRowTargetQty("");
    setRowExpenseAmount("");
    setRowRevenueAmount("");
    setEditingItemId("");
  };

  /* -----------------------------------------------------------
     CREATE THE HEADER USING THE FRONTEND-GENERATED TARGET NO
     (retries once with a freshly recomputed number if another
     submission already claimed it)
  ----------------------------------------------------------- */
  const createHeader = async (): Promise<TargetEntry> => {
    let candidate =
      targetNo || computeNextTargetNo((await targetEntryServiceApi.list()) as TargetEntry[]);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const headerRes = await targetEntryServiceApi.create({
          target_no: candidate,
          site_id: siteId,
          entry_month: `${entryMonth}-01`,
        });
        return (headerRes?.data || headerRes) as TargetEntry;
      } catch (error: any) {
        const hasTargetNoConflict = Boolean(error?.response?.data?.target_no);
        if (hasTargetNoConflict && attempt === 0) {
          const latest = (await targetEntryServiceApi.list()) as TargetEntry[];
          candidate = computeNextTargetNo(latest);
          setTargetNo(candidate);
          continue;
        }
        throw error;
      }
    }

    throw new Error("Unable to generate a unique target entry number.");
  };

  /* -----------------------------------------------------------
     ADD / UPDATE A SUBLIST ROW
  ----------------------------------------------------------- */
  const handleAddRow = async () => {
    if (!siteId) {
      Swal.fire({ icon: "error", title: "Site Name is required" });
      return;
    }
    if (!rowItemType) {
      Swal.fire({ icon: "error", title: "Item Type is required" });
      return;
    }
    if (!rowTargetQty) {
      Swal.fire({ icon: "error", title: "Target Qty is required" });
      return;
    }

    setSavingRow(true);
    try {
      let headerId = targetEntryId;

      if (!headerId) {
        const headerData = await createHeader();
        headerId = headerData.unique_id;
        setTargetEntryId(headerId);
        setTargetNo(headerData.target_no ?? "");
      }

      const payload = {
        target_entry: headerId,
        item_type: rowItemType,
        sub_category: rowSubCategory || null,
        target_qty: rowTargetQty,
        expense_amount: rowExpenseAmount || "0",
        revenue_amount: rowRevenueAmount || "0",
      };

      if (editingItemId) {
        await targetEntryItemServiceApi.update(editingItemId, payload);
      } else {
        await targetEntryItemServiceApi.create(payload);
      }

      await refreshItems(headerId);
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

  const handleEditRow = (item: TargetEntryItem) => {
    setEditingItemId(item.unique_id);
    setRowItemType(item.item_type);
    setRowSubCategory(item.sub_category ?? "");
    setRowTargetQty(String(item.target_qty ?? ""));
    setRowExpenseAmount(String(item.expense_amount ?? ""));
    setRowRevenueAmount(String(item.revenue_amount ?? ""));
  };

  const handleDeleteRow = async (item: TargetEntryItem) => {
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
      await targetEntryItemServiceApi.remove(item.unique_id);
      if (targetEntryId) await refreshItems(targetEntryId);
      if (editingItemId === item.unique_id) resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    }
  };

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          qty: acc.qty + toNumber(item.target_qty),
          expense: acc.expense + toNumber(item.expense_amount),
          revenue: acc.revenue + toNumber(item.revenue_amount),
        }),
        { qty: 0, expense: 0, revenue: 0 },
      ),
    [items],
  );

  const isFormDisabled = fetching || savingHeader;
  const isRowDisabled = isFormDisabled || savingRow;

  const itemTypeName = (item: TargetEntryItem) =>
    item.item_type_name ??
    itemTypes.find((t) => t.unique_id === item.item_type)?.item_type ??
    "-";

  const subCategoryName = (item: TargetEntryItem) =>
    item.sub_category_name ??
    subCategories.find((sc) => sc.unique_id === item.sub_category)
      ?.sub_category_name ??
    "-";

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Target Entry" : "Add New Target Entry"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Target Entry No</Label>
            <Input
              value={targetNo || "Auto-generated on first item"}
              readOnly
              disabled
              className="font-semibold text-red-600 disabled:opacity-100"
            />
          </div>

          <div>
            <Label>Date *</Label>
            <Input
              type="month"
              value={entryMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={isFormDisabled}
              required
            />
          </div>

          <div>
            <Label>Site Name *</Label>
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
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left w-12">S.No</th>
                <th className="border px-3 py-2 text-left">Item Type *</th>
                <th className="border px-3 py-2 text-left">Sub Category Type</th>
                <th className="border px-3 py-2 text-right">Target Qty *</th>
                <th className="border px-3 py-2 text-right">Expense Amount</th>
                <th className="border px-3 py-2 text-right">Revenue Amount</th>
                <th className="border px-3 py-2 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.unique_id}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{itemTypeName(item)}</td>
                  <td className="border px-3 py-2">{subCategoryName(item)}</td>
                  <td className="border px-3 py-2 text-right">{item.target_qty}</td>
                  <td className="border px-3 py-2 text-right">{item.expense_amount}</td>
                  <td className="border px-3 py-2 text-right">{item.revenue_amount}</td>
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
                  <Select
                    value={rowItemType || undefined}
                    onValueChange={(value) => {
                      setRowItemType(value);
                      setRowSubCategory("");
                    }}
                    disabled={isRowDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Select
                    value={rowSubCategory || undefined}
                    onValueChange={setRowSubCategory}
                    disabled={isRowDisabled || !rowItemType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowTargetQty}
                    onChange={(e) => setRowTargetQty(e.target.value)}
                    disabled={isRowDisabled}
                    className="text-right"
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowExpenseAmount}
                    onChange={(e) => setRowExpenseAmount(e.target.value)}
                    disabled={isRowDisabled}
                    className="text-right"
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowRevenueAmount}
                    onChange={(e) => setRowRevenueAmount(e.target.value)}
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
                <td className="border px-3 py-2 text-right">{totals.expense}</td>
                <td className="border px-3 py-2 text-right">{totals.revenue}</td>
                <td className="border px-3 py-2" />
              </tr>
            </tfoot>
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
