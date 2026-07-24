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

import { freightLetterApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { FreightLetter } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function FreightLetterForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encFreightLetter } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encFreightLetter}`;

  const [dcEntryId, setDcEntryId] = useState("");
  const [freightEntryId, setFreightEntryId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [transportName, setTransportName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverContactNo, setDriverContactNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [existingDocument, setExistingDocument] = useState<string | null>(null);

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
        const res = await freightLetterApi.get(id as string);
        const data = (res?.data || res) as FreightLetter;

        setDcEntryId(data.dc_entry_id ?? "");
        setFreightEntryId(data.freight_entry_id ?? "");
        setCustomerName(data.customer_name ?? "");
        setSiteId(data.site_id ?? "");
        setTransportName(data.transport_name ?? "");
        setDriverName(data.driver_name ?? "");
        setDriverContactNo(data.driver_contact_no ?? "");
        setVehicleNo(data.vehicle_no ?? "");
        setExistingDocument(data.document_file ?? null);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load freight letter",
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

    const formData = new FormData();
    formData.append("dc_entry_id", dcEntryId.trim());
    formData.append("freight_entry_id", freightEntryId.trim());
    formData.append("customer_name", customerName.trim());
    formData.append("site_id", siteId);
    formData.append("transport_name", transportName.trim());
    formData.append("driver_name", driverName.trim());
    formData.append("driver_contact_no", driverContactNo.trim());
    formData.append("vehicle_no", vehicleNo.trim());

    if (documentFile) {
      formData.append("document_file", documentFile);
    }

    try {
      if (isEdit) {
        await freightLetterApi.update(id as string, formData);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await freightLetterApi.create(formData);
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
      <ComponentCard title={isEdit ? "Edit Freight Letter" : "Add New Freight Letter"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>DC Entry ID</Label>
              <Input
                value={dcEntryId}
                onChange={(e) => setDcEntryId(e.target.value)}
                placeholder="DC Entry ID"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Freight Entry ID</Label>
              <Input
                value={freightEntryId}
                onChange={(e) => setFreightEntryId(e.target.value)}
                placeholder="Freight Entry ID"
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
              <Label>Transport Name</Label>
              <Input
                value={transportName}
                onChange={(e) => setTransportName(e.target.value)}
                placeholder="Transport Name"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Driver Name</Label>
              <Input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Driver Name"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Driver Contact</Label>
              <Input
                value={driverContactNo}
                onChange={(e) => setDriverContactNo(e.target.value)}
                placeholder="Driver Contact"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Vehicle No</Label>
              <Input
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="Vehicle No"
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Document Upload</Label>
              <Input
                type="file"
                onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                disabled={isFormDisabled}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {existingDocument && !documentFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Current: {existingDocument.split("/").pop()}
                </p>
              )}
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
