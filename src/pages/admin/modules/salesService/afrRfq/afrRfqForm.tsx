import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { afrRfqApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { AfrTransportRfq } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function AfrRfqForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encAfrRfq } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encAfrRfq}`;

  /* ---------------- State ---------------- */
  const [transportType, setTransportType] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loadType, setLoadType] = useState<string>("per_ton");
  const [dueDate, setDueDate] = useState("");
  const [siteId, setSiteId] = useState("");
  const [emailMode, setEmailMode] = useState<1 | 2>(1);
  const [toEmail, setToEmail] = useState("");
  const [bcc, setBcc] = useState("");
  const [status, setStatus] = useState(true);

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const siteOptions = toOptions(sites, (s) => s.unique_id, (s) => s.site_name);

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await afrRfqApi.get(id as string);
        const data = (res?.data || res) as AfrTransportRfq;

        setTransportType(data.request_quotation_transportation ?? "");
        setSource(data.source ?? "");
        setDestination(data.destination ?? "");
        setLoadType(data.load_type ?? "per_ton");
        setDueDate((data.due_date ?? "").slice(0, 10));
        setSiteId(data.site_id ?? "");
        setEmailMode(data.email_mode ?? 1);
        setToEmail(data.toemail ?? "");
        setBcc(data.bcc ?? "");
        setStatus(data.status ?? true);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load RFQ",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     SUBMIT HANDLER
  ----------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!transportType.trim()) {
      Swal.fire({ icon: "error", title: "Transport Type is required" });
      return;
    }
    if (!source.trim()) {
      Swal.fire({ icon: "error", title: "Source is required" });
      return;
    }
    if (!destination.trim()) {
      Swal.fire({ icon: "error", title: "Destination is required" });
      return;
    }

    setLoading(true);

    const payload = {
      request_quotation_transportation: transportType.trim(),
      source: source.trim(),
      destination: destination.trim(),
      load_type: loadType,
      due_date: dueDate,
      site_id: siteId || null,
      email_mode: emailMode,
      toemail: toEmail.trim(),
      bcc: bcc.trim(),
      status,
    };

    try {
      if (isEdit) {
        await afrRfqApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await afrRfqApi.create(payload);
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
        error?.response?.data?.detail ||
        extractErrorMessage(error) ||
        "Unable to save RFQ.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || fetching;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit AFR Transport RFQ" : "Add New AFR Transport RFQ"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Transport Type *</Label>
              <Input
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                placeholder="Transport Type"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Source *</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Destination *</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Load Type *</Label>
              <Select
                value={loadType}
                onValueChange={(value) => setLoadType(value as "per_ton" | "per_trip" | "fixed")}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_ton">Per Ton</SelectItem>
                  <SelectItem value="per_trip">Per Trip</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Site</Label>
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
              <Label>Email Mode</Label>
              <Select
                value={String(emailMode)}
                onValueChange={(value) => setEmailMode(Number(value) as 1 | 2)}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mode 1</SelectItem>
                  <SelectItem value="2">Mode 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <div className="pt-2">
                <Switch
                  checked={status}
                  onCheckedChange={setStatus}
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>To Email</Label>
              <Input
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="To Email"
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>BCC</Label>
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="BCC"
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
