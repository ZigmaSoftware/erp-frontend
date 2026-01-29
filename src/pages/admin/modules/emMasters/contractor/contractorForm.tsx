import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
import { Textarea } from "@/components/ui/textarea";


import { contractorApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

/* =======================
   REGEX VALIDATIONS
======================= */
const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export default function ContractorForm() {
  /* =======================
     STATE
  ======================= */
  const [contractorName, setContractorName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [gstType, setGstType] = useState<"yes" | "no">("no");
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [address, setAddress] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encEmMasters, encContractor } = getEncryptedRoute();
  const ENC_LIST = `/${encEmMasters}/${encContractor}`;

  /* =======================
     FETCH (EDIT MODE)
  ======================= */
  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchContractor = async () => {
      try {
        const data: any = await contractorApi.get(id);

        setContractorName(data.contractor_name ?? "");
        setContactPerson(data.contact_person ?? "");
        setMobileNo(data.mobile_no ?? "");
        setEmail(data.email ?? "");
        setGstType(data.gst_type ?? "no");
        setGstNo(data.gst_no ?? "");
        setPanNo(data.pan_no ?? "");
        setOpeningBalance(String(data.opening_balance ?? ""));
        setAddress(data.address ?? "");
        setBankDetails(data.bank_details ?? "");
        setIsActive(Boolean(data.is_active));
      } catch {
        Swal.fire("Error", "Failed to load contractor", "error");
      }
    };

    fetchContractor();
  }, [id, isEdit]);

  /* =======================
     SUBMIT
  ======================= */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    /* ---- Frontend validation ---- */
    if (gstType === "yes" && !GST_REGEX.test(gstNo)) {
      Swal.fire("Invalid GST Number", "", "error");
      return;
    }

    if (panNo && !PAN_REGEX.test(panNo)) {
      Swal.fire("Invalid PAN Number", "", "error");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        contractor_name: contractorName,
        contact_person: contactPerson,
        mobile_no: mobileNo,
        email,
        gst_type: gstType,
        gst_no: gstType === "yes" ? gstNo : null,
        pan_no: panNo || null,
        opening_balance: openingBalance,
        address: address,
        bank_details: bankDetails || null,
        is_active: isActive,
      };

      if (isEdit) {
        await contractorApi.update(id as string, payload);
      } else {
        await contractorApi.create(payload);
      }

      Swal.fire({
        icon: "success",
        title: "Saved successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST);
    } catch (error: any) {
      const message =
        Object.values(error?.response?.data ?? {})
          .flat()
          .join("\n") || "Save failed";

      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     UI
  ======================= */
  return (
    <ComponentCard title={isEdit ? "Edit Contractor" : "Add Contractor"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Contractor Name *</Label>
            <Input
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Contact Person *</Label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Mobile No *</Label>
            <Input
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              maxLength={10}
              required
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label>GST Type</Label>
            <Select value={gstType} onValueChange={(v) => setGstType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {gstType === "yes" && (
            <div>
              <Label>GST No *</Label>
              <Input
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
              />
            </div>
          )}

          <div>
            <Label>PAN No</Label>
            <Input
              value={panNo}
              onChange={(e) => setPanNo(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <Label>Opening Balance *</Label>
            <Input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full address"
              rows={3}
            />
          </div>


          <div className="md:col-span-2">
            <Label>Bank Details</Label>
            <Textarea
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="Bank name, Account No, IFSC, Branch"
              rows={3}
            />
          </div>

        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(ENC_LIST)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
