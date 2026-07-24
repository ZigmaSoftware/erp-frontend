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

import { scrapQuotationApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  ScrapQuotation,
  ScrapQuotationSub,
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

export default function ScrapQuotationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encScrapQuotation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encScrapQuotation}`;

  /* ---------------- Header state ---------------- */
  const [partyName, setPartyName] = useState("");
  const [partyMobileNo, setPartyMobileNo] = useState("");
  const [siteId, setSiteId] = useState("");
  const [quoteMonth, setQuoteMonth] = useState(currentMonthValue());

  /* ---------------- Sublist state ---------------- */
  const [items, setItems] = useState<ScrapQuotationSub[]>([]);
  const [editingItemId, setEditingItemId] = useState<string>("");

  const [rowItemId, setRowItemId] = useState("");
  const [rowRate, setRowRate] = useState("");
  const [rowAmount, setRowAmount] = useState("");
  const [rowGstValue, setRowGstValue] = useState("");
  const [rowTotAmount, setRowTotAmount] = useState("");

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
        const res = await scrapQuotationApi.get(id as string);
        const data = (res?.data || res) as ScrapQuotation;

        setPartyName(data.party_name ?? "");
        setPartyMobileNo(data.party_mobile_no ?? "");
        setSiteId(data.site_id ?? "");
        setQuoteMonth((data.quote_month ?? currentMonthValue()).slice(0, 7));
        setItems(data.sub_items ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load scrap quotation",
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
      await scrapQuotationApi.update(id, {
        [field]: field === "quote_month" ? `${value}-01` : value,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to update quotation",
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

  /* -----------------------------------------------------------
     ADD / UPDATE A SUBLIST ROW
  ----------------------------------------------------------- */
  const handleAddRow = async () => {
    if (!partyName.trim()) {
      Swal.fire({ icon: "error", title: "Party Name is required" });
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
        const headerRes = await scrapQuotationApi.create({
          party_name: partyName.trim(),
          party_mobile_no: partyMobileNo.trim(),
          site_id: siteId,
          quote_month: `${quoteMonth}-01`,
        });
        const headerData = (headerRes?.data || headerRes) as ScrapQuotation;
        headerId = headerData.unique_id;
        navigate(`/${encSalesService}/${encScrapQuotation}/${headerId}/edit`, { replace: true });
      }

      const payload = {
        main: headerId,
        item_id: rowItemId,
        rate: rowRate || "0",
        amount: rowAmount || "0",
        gst_value: rowGstValue || "0",
        tot_amount: rowTotAmount || "0",
      };

      if (editingItemId) {
        await scrapQuotationApi.update(editingItemId, payload);
      } else {
        await scrapQuotationApi.create(payload);
      }

      if (headerId) {
        const res = await scrapQuotationApi.get(headerId);
        const data = (res?.data || res) as ScrapQuotation;
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

  const handleEditRow = (item: ScrapQuotationSub) => {
    setEditingItemId(item.unique_id);
    setRowItemId(item.item_id);
    setRowRate(String(item.rate ?? ""));
    setRowAmount(String(item.amount ?? ""));
    setRowGstValue(String(item.gst_value ?? ""));
    setRowTotAmount(String(item.tot_amount ?? ""));
  };

  const handleDeleteRow = async (item: ScrapQuotationSub) => {
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
      await scrapQuotationApi.remove(item.unique_id);
      if (id) {
        const res = await scrapQuotationApi.get(id);
        const data = (res?.data || res) as ScrapQuotation;
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
    setRowItemId("");
    setRowRate("");
    setRowAmount("");
    setRowGstValue("");
    setRowTotAmount("");
    setEditingItemId("");
  };

  const isFormDisabled = fetching || savingHeader;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Scrap Quotation" : "Add New Scrap Quotation"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Party Name *</Label>
            <Input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Party Name"
              disabled={isFormDisabled}
              required
            />
          </div>

          <div>
            <Label>Party Mobile No</Label>
            <Input
              value={partyMobileNo}
              onChange={(e) => setPartyMobileNo(e.target.value)}
              placeholder="Party Mobile No"
              disabled={isFormDisabled}
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
            <Label>Quote Month *</Label>
            <Input
              type="month"
              value={quoteMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
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
                <th className="border px-3 py-2 text-left">Item *</th>
                <th className="border px-3 py-2 text-right">Rate</th>
                <th className="border px-3 py-2 text-right">Amount</th>
                <th className="border px-3 py-2 text-right">GST Value</th>
                <th className="border px-3 py-2 text-right">Total Amount</th>
                <th className="border px-3 py-2 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.unique_id}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{item.item_name ?? item.item_id}</td>
                  <td className="border px-3 py-2 text-right">{item.rate}</td>
                  <td className="border px-3 py-2 text-right">{item.amount}</td>
                  <td className="border px-3 py-2 text-right">{item.gst_value}</td>
                  <td className="border px-3 py-2 text-right">{item.tot_amount}</td>
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
                    value={rowItemId}
                    onChange={(e) => setRowItemId(e.target.value)}
                    placeholder="Item ID"
                    disabled={isRowDisabled}
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
                    value={rowGstValue}
                    onChange={(e) => setRowGstValue(e.target.value)}
                    disabled={isRowDisabled}
                    className="text-right"
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={rowTotAmount}
                    onChange={(e) => setRowTotAmount(e.target.value)}
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
