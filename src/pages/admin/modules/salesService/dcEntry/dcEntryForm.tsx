import { useEffect, useState, type FormEvent } from "react";
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

import { dcEntryApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { DcEntry } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function DcEntryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encDcEntry } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encDcEntry}`;

  const [dcDate, setDcDate] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [dcType, setDcType] = useState("");
  const [description, setDescription] = useState("");

  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const siteOptions = toOptions(sites, (s) => s.unique_id, (s) => s.site_name);
  const customerOptions = toOptions(customers, (c) => c.unique_id, (c) => c.customer_name);

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await dcEntryApi.get(id as string);
        const data = (res?.data || res) as DcEntry;

        setDcDate(data.dc_date ?? "");
        setEntryDate(data.entry_date ?? "");
        setCustomerName(data.customer_name ?? "");
        setSiteId(data.site_id ?? "");
        setInvoiceNo(data.invoice_no ?? "");
        setWorkOrderNo(data.work_order_no ?? "");
        setDcType(data.dc_type ?? "");
        setDescription(data.description ?? "");
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load DC entry",
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
      dc_date: dcDate,
      entry_date: entryDate,
      customer_name: customerName,
      site_id: siteId,
      invoice_no: invoiceNo.trim(),
      work_order_no: workOrderNo.trim(),
      dc_type: dcType.trim(),
      description: description.trim() || null,
    };

    try {
      if (isEdit) {
        await dcEntryApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await dcEntryApi.create(payload);
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
        error?.response?.data?.dc_no?.[0] ||
        error?.response?.data?.customer_name?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save DC entry.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = fetching || loading;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit DC Entry" : "Add New DC Entry"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>DC Date *</Label>
              <Input
                type="date"
                value={dcDate}
                onChange={(e) => setDcDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

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
              <Label>Invoice No</Label>
              <Input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Invoice No"
                disabled={isFormDisabled}
              />
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

            <div>
              <Label>DC Type *</Label>
              <Select
                value={dcType}
                onValueChange={setDcType}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supply">Supply</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
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
