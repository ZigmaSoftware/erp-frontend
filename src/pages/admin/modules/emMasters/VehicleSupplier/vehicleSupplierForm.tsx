import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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
import { vehicleSupplierApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { vehicleSupplierSchema } from "@/validations/emMasters/vehicle-supplier.schema";
import { extractErrorMessage } from "@/utils/errorUtils";
import { toBoolean } from "@/utils/formHelpers";
import type { VehicleSupplierDetail } from "@/types/emMasters/forms";

const GST_TYPE_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const TRANSPORT_TYPE_OPTIONS = [
  { label: "Machinery", value: "machinery" },
  { label: "Tipper", value: "tipper" },
  { label: "Genset", value: "genset" },
  { label: "Others", value: "others" },
];

const { encEmMasters, encVehicleSupplier } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encVehicleSupplier}`;

const vehicleSupplierDetailQueryKey = (id: string | undefined) =>
  [...masterQueryKeys.vehicleSuppliers, "detail", id ?? "new"] as const;

export default function VehicleSupplierForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [supplierName, setSupplierName] = useState("");
  const [proprietorName, setProprietorName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [gstType, setGstType] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [transportMedium, setTransportMedium] = useState("");
  const [address, setAddress] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  const detailQuery = useQuery({
    queryKey: vehicleSupplierDetailQueryKey(id),
    queryFn: () => vehicleSupplierApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data) return;

    const data = detailQuery.data as VehicleSupplierDetail;
    setSupplierName(data.supplier_name ?? "");
    setProprietorName(data.proprietor_name ?? "");
    setMobileNo(data.mobile_no ?? "");
    setEmail(data.email ?? "");
    setGstType(data.gst_type ?? "");
    setGstNo(data.gst_no ?? "");
    setPanNo(data.pan_no ?? "");
    setTransportMedium(data.transport_medium ?? "");
    setAddress(data.address ?? "");
    setBankDetails(data.bank_details ?? "");
    setExistingImage(data.image ?? "");
    setIsActive(toBoolean(data.is_active));
  }, [detailQuery.data]);

  useEffect(() => {
    if (!detailQuery.error) return;
    Swal.fire("Error", "Failed to load vehicle supplier", "error");
  }, [detailQuery.error]);

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      isEdit
        ? vehicleSupplierApi.uploadUpdate(id as string, payload)
        : vehicleSupplierApi.upload(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vehicleSuppliers });
      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate(ENC_LIST_PATH);
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedGstType = gstType || "no";

    const validation = vehicleSupplierSchema.safeParse({
      supplier_name: supplierName.trim(),
      proprietor_name: proprietorName.trim(),
      mobile_no: mobileNo.trim(),
      email: email.trim(),
      gst_type: normalizedGstType,
      gst_no: gstNo.trim(),
      pan_no: panNo.trim(),
      transport_medium: transportMedium,
      address: address.trim(),
      bank_details: bankDetails.trim(),
      is_active: isActive,
    });

    if (!validation.success) {
      Swal.fire("Validation error", validation.error.issues[0]?.message ?? "Please review the form.", "error");
      return;
    }

    const payload = new FormData();
    payload.append("supplier_name", validation.data.supplier_name);
    payload.append("proprietor_name", validation.data.proprietor_name);
    payload.append("mobile_no", validation.data.mobile_no);
    payload.append("email", validation.data.email);
    payload.append("gst_type", validation.data.gst_type);
    payload.append("gst_no", validation.data.gst_type === "yes" ? validation.data.gst_no : "");
    payload.append("pan_no", validation.data.pan_no);
    payload.append("transport_medium", validation.data.transport_medium);
    payload.append("address", validation.data.address);
    payload.append("bank_details", validation.data.bank_details);
    payload.append("is_active", String(validation.data.is_active));

    if (imageFile) payload.append("image", imageFile);

    saveMutation.mutate(payload);
  };

  const isSubmitting = saveMutation.isPending;
  const isFormDisabled = isSubmitting || detailQuery.isFetching;

  return (
    <ComponentCard title={isEdit ? "Edit Vehicle Supplier" : "Add Vehicle Supplier"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="supplierName">Supplier Name <span className="text-red-500">*</span></Label>
            <Input
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="proprietorName">Proprietor Name <span className="text-red-500">*</span></Label>
            <Input
              id="proprietorName"
              value={proprietorName}
              onChange={(e) => setProprietorName(e.target.value)}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="mobileNo">Mobile No <span className="text-red-500">*</span></Label>
            <Input
              id="mobileNo"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="gstType">GST Type</Label>
            <Select value={gstType} onValueChange={setGstType} disabled={isFormDisabled}>
              <SelectTrigger id="gstType" className="w-full">
                <SelectValue placeholder="Select GST Type" />
              </SelectTrigger>
              <SelectContent>
                {GST_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gstNo">GST No</Label>
            <Input
              id="gstNo"
              value={gstNo}
              onChange={(e) => setGstNo(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="panNo">PAN No</Label>
            <Input
              id="panNo"
              value={panNo}
              onChange={(e) => setPanNo(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="transportMedium">Transport Medium</Label>
            <Select
              value={transportMedium}
              onValueChange={setTransportMedium}
              disabled={isFormDisabled}
            >
              <SelectTrigger id="transportMedium" className="w-full">
                <SelectValue placeholder="Select Transport Medium" />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
            <textarea
              id="address"
              value={address}
              required
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-sm"
              disabled={isFormDisabled}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="bankDetails">Bank Details</Label>
            <textarea
              id="bankDetails"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-sm"
              disabled={isFormDisabled}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="imageFile">Image</Label>

            <div className="border-2 w-64 rounded-lg">
              <input
                id="imageFile"
                type="file"
                accept="image/*"
                className="ml-5"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                disabled={isFormDisabled}
              />
            </div>

            {(existingImage || imageFile) && (
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : existingImage}
                className="h-16 w-16 mt-2 rounded border object-cover"
              />
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
              disabled={isFormDisabled}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update" : "Save")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
