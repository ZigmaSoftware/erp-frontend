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

import { coProcessingApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { CoProcessingCertificate } from "../types/salesService.types";

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

export default function CoProcessingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encCoProcessing } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encCoProcessing}`;

  const [cpcMonth, setCpcMonth] = useState(currentMonthValue());
  const [entryDate, setEntryDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [prevDiff, setPrevDiff] = useState("");
  const [totalDispQty, setTotalDispQty] = useState("");
  const [totalReceivedQty, setTotalReceivedQty] = useState("");
  const [remarks, setRemarks] = useState("");

  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const diff = useMemo(() => {
    const disp = parseFloat(totalDispQty) || 0;
    const received = parseFloat(totalReceivedQty) || 0;
    return String(disp - received);
  }, [totalDispQty, totalReceivedQty]);

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
        const res = await coProcessingApi.get(id as string);
        const data = (res?.data || res) as CoProcessingCertificate;

        setCpcMonth((data.cpc_month ?? currentMonthValue()).slice(0, 7));
        setEntryDate(data.entry_date ?? "");
        setCustomerName(data.customer_name ?? "");
        setSiteId(data.site_id ?? "");
        setPrevDiff(String(data.prev_diff ?? ""));
        setTotalDispQty(String(data.total_disp_qty ?? ""));
        setTotalReceivedQty(String(data.total_received_qty ?? ""));
        setRemarks(data.remarks ?? "");
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load co-processing record",
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
      cpc_month: `${cpcMonth}-01`,
      entry_date: entryDate,
      customer_name: customerName.trim(),
      site_id: siteId,
      prev_diff: prevDiff || "0",
      total_disp_qty: totalDispQty || "0",
      total_received_qty: totalReceivedQty || "0",
      diff,
      remarks: remarks.trim() || null,
    };

    try {
      if (isEdit) {
        await coProcessingApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await coProcessingApi.create(payload);
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
      <ComponentCard title={isEdit ? "Edit Co Processing" : "Add New Co Processing"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>CPC Month *</Label>
              <Input
                type="month"
                value={cpcMonth}
                onChange={(e) => setCpcMonth(e.target.value)}
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
              <Label>Previous Diff</Label>
              <Input
                type="number"
                step="0.01"
                value={prevDiff}
                onChange={(e) => setPrevDiff(e.target.value)}
                placeholder="Previous Diff"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Total Dispatch Qty</Label>
              <Input
                type="number"
                step="0.01"
                value={totalDispQty}
                onChange={(e) => setTotalDispQty(e.target.value)}
                placeholder="Total Dispatch Qty"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Total Received Qty</Label>
              <Input
                type="number"
                step="0.01"
                value={totalReceivedQty}
                onChange={(e) => setTotalReceivedQty(e.target.value)}
                placeholder="Total Received Qty"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Diff (Auto-calculated)</Label>
              <Input
                type="number"
                step="0.01"
                value={diff}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks"
                rows={3}
                disabled={isFormDisabled}
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
