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

import { confirmationReceiptApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { ConfirmationReceipt } from "../types/salesService.types";

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

export default function ConfirmationReceiptForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encConfirmationReceipt } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encConfirmationReceipt}`;

  const [monthYear, setMonthYear] = useState(currentMonthValue());
  const [customerName, setCustomerName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [entryDate, setEntryDate] = useState("");

  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await confirmationReceiptApi.get(id as string);
        const data = (res?.data || res) as ConfirmationReceipt;

        setMonthYear((data.month_year ?? currentMonthValue()).slice(0, 7));
        setCustomerName(data.scrap_customer_id ?? "");
        setSiteId(data.site_id ?? "");
        setTotalValue(String(data.total_value ?? ""));
        setEntryDate(data.entry_date ?? "");
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load confirmation receipt",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      month_year: `${monthYear}-01`,
      scrap_customer_id: customerName.trim(),
      site_id: siteId,
      total_value: totalValue || "0",
      entry_date: entryDate,
    };

    try {
      if (isEdit) {
        await confirmationReceiptApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await confirmationReceiptApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || fetching;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Confirmation Receipt" : "Add New Confirmation Receipt"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Month Year *</Label>
              <Input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                disabled={isFormDisabled}
                required
              />
            </div>

            <div>
              <Label>Customer *</Label>
              <Select
                value={customerName}
                onValueChange={setCustomerName}
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
              <Label>Total Value *</Label>
              <Input
                type="number"
                step="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="Total Value"
                disabled={isFormDisabled}
                required
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
