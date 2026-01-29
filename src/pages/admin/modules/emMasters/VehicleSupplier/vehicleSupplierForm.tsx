import { useEffect, useState } from "react";
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
import { vehicleSupplierApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

/* =======================
   DROPDOWN OPTIONS
======================= */
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

/* =======================
   ROUTES
======================= */
const { encEmMasters, encVehicleSupplier } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encVehicleSupplier}`;

export default function VehicleSupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  /* =======================
     STATE
  ======================= */
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
  const [loading, setLoading] = useState(false);

  /* =======================
     LOAD DATA FOR EDIT
  ======================== */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      try {
        const res = await vehicleSupplierApi.get(id as string);
        const data = (res as any)?.data ?? res;

        setSupplierName(data?.supplier_name ?? "");
        setProprietorName(data?.proprietor_name ?? "");
        setMobileNo(data?.mobile_no ?? "");
        setEmail(data?.email ?? "");
        setGstType(data?.gst_type ?? "");
        setGstNo(data?.gst_no ?? "");
        setPanNo(data?.pan_no ?? "");
        setTransportMedium(data?.transport_medium ?? "");
        setAddress(data?.address ?? "");
        setBankDetails(data?.bank_details ?? "");
        setExistingImage(data?.image ?? "");
        setIsActive(Boolean(data?.is_active));
      } catch (err) {
        Swal.fire("Error", "Failed to load vehicle supplier", "error");
      }
    };

    loadData();
  }, [id, isEdit]);

  /* =======================
     HANDLE SUBMIT
  ======================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!supplierName || !proprietorName || !mobileNo || !address) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields before submitting.",
      });
      return;
    }

    setLoading(true);
    const payload = new FormData();
    payload.append("supplier_name", supplierName);
    payload.append("proprietor_name", proprietorName);
    payload.append("mobile_no", mobileNo);
    payload.append("email", email);
    payload.append("gst_type", gstType);
    payload.append("gst_no", gstNo);
    payload.append("pan_no", panNo);
    payload.append("transport_medium", transportMedium);
    payload.append("address", address);
    payload.append("bank_details", bankDetails);
    payload.append("is_active", String(isActive));

    if (imageFile) payload.append("image", imageFile);

    try {
      if (isEdit) {
        await vehicleSupplierApi.uploadUpdate(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await vehicleSupplierApi.upload(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: err?.response?.data?.detail ?? "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     RENDER FORM
  ======================== */
  return (
    <ComponentCard title={isEdit ? "Edit Vehicle Supplier" : "Add Vehicle Supplier"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier Name */}
          <div>
            <Label htmlFor="supplierName">Supplier Name <span className="text-red-500">*</span></Label>
            <Input
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
            />
          </div>

          {/* Proprietor Name */}
          <div>
            <Label htmlFor="proprietorName">Proprietor Name <span className="text-red-500">*</span></Label>
            <Input
              id="proprietorName"
              value={proprietorName}
              onChange={(e) => setProprietorName(e.target.value)}
              required
            />
          </div>

          {/* Mobile No */}
          <div>
            <Label htmlFor="mobileNo">Mobile No <span className="text-red-500">*</span></Label>
            <Input
              id="mobileNo"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* GST Type */}
          <div>
            <Label htmlFor="gstType">GST Type</Label>
            <Select value={gstType} onValueChange={setGstType}>
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

          {/* GST No */}
          <div>
            <Label htmlFor="gstNo">GST No</Label>
            <Input id="gstNo" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
          </div>

          {/* PAN No */}
          <div>
            <Label htmlFor="panNo">PAN No</Label>
            <Input id="panNo" value={panNo} onChange={(e) => setPanNo(e.target.value)} />
          </div>

          {/* Transport Medium */}
          <div>
            <Label htmlFor="transportMedium">Transport Medium</Label>
            <Select value={transportMedium} onValueChange={setTransportMedium}>
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

          {/* Address */}
          <div className="md:col-span-2">
            <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
            <textarea
              id="address"
              value={address}
              required
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-sm"
            />
          </div>

          {/* Bank Details */}
          <div className="md:col-span-2">
            <Label htmlFor="bankDetails">Bank Details</Label>
            <textarea
              id="bankDetails"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-sm"
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <Label htmlFor="imageFile">Image</Label>

            <div className="border-2 w-64 rounded-lg">
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    className="ml-5"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />

            </div>

            {(existingImage || imageFile) && (
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : existingImage}
                className="h-16 w-16 mt-2 rounded border object-cover"
              />
            )}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={isActive ? "true" : "false"} onValueChange={(val) => setIsActive(val === "true")}>
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

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update" : "Save")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
