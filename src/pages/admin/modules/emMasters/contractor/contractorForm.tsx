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
import { Textarea } from "@/components/ui/textarea";

import { contractorApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { contractorSchema } from "@/validations/emMasters/contractor.schema";
import { extractErrorMessage } from "@/utils/errorUtils";
import { toBoolean } from "@/utils/formHelpers";
import type {
  ContractorDetail,
  ContractorSubmitPayload,
} from "@/types/emMasters/forms";

const contractorDetailQueryKey = (id: string | undefined) =>
  [...masterQueryKeys.contractors, "detail", id ?? "new"] as const;

const normalizeGstType = (value: string | undefined): "yes" | "no" =>
  String(value ?? "").toLowerCase() === "yes" ? "yes" : "no";

export default function ContractorForm() {
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

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encEmMasters, encContractor } = getEncryptedRoute();
  const ENC_LIST = `/${encEmMasters}/${encContractor}`;

  const detailQuery = useQuery({
    queryKey: contractorDetailQueryKey(id),
    queryFn: () => contractorApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data) return;

    const data = detailQuery.data as ContractorDetail;
    setContractorName(data.contractor_name ?? "");
    setContactPerson(data.contact_person ?? "");
    setMobileNo(data.mobile_no ?? "");
    setEmail(data.email ?? "");
    setGstType(normalizeGstType(data.gst_type));
    setGstNo(data.gst_no ?? "");
    setPanNo(data.pan_no ?? "");
    setOpeningBalance(String(data.opening_balance ?? ""));
    setAddress(data.address ?? "");
    setBankDetails(data.bank_details ?? "");
    setIsActive(toBoolean(data.is_active));
  }, [detailQuery.data]);

  useEffect(() => {
    if (!detailQuery.error) return;

    Swal.fire({
      icon: "error",
      title: "Failed to load contractor",
      text: extractErrorMessage(detailQuery.error),
    });
  }, [detailQuery.error]);

  const saveMutation = useMutation({
    mutationFn: (payload: ContractorSubmitPayload) =>
      isEdit
        ? contractorApi.update(id as string, payload)
        : contractorApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.contractors,
      });

      Swal.fire({
        icon: "success",
        title: "Saved successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST);
    },
    onError: (error) => {
      Swal.fire("Error", extractErrorMessage(error), "error");
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedGstType = gstType || "no";

    const validation = contractorSchema.safeParse({
      contractor_name: contractorName.trim(),
      contact_person: contactPerson.trim(),
      mobile_no: mobileNo.trim(),
      email: email.trim(),
      gst_type: normalizedGstType,
      gst_no: gstNo.trim(),
      pan_no: panNo.trim(),
      opening_balance: openingBalance.trim(),
      address: address.trim(),
      bank_details: bankDetails.trim(),
      is_active: isActive,
    });

    if (!validation.success) {
      Swal.fire("Validation error", validation.error.issues[0]?.message ?? "Please review the form.", "error");
      return;
    }

    saveMutation.mutate({
      ...validation.data,
      gst_no:
        validation.data.gst_type === "yes"
          ? (validation.data.gst_no ?? "") || null
          : null,
      pan_no: (validation.data.pan_no ?? "") || null,
      bank_details: (validation.data.bank_details ?? "") || null,
      opening_balance: validation.data.opening_balance ?? "",
    });
  };

  const isSubmitting = saveMutation.isPending;
  const isFormDisabled = isSubmitting || detailQuery.isFetching;

  return (
    <ComponentCard title={isEdit ? "Edit Contractor" : "Add Contractor"}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Contractor Name *</Label>
            <Input
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>Contact Person *</Label>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>Mobile No *</Label>
            <Input
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              maxLength={10}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>GST Type</Label>
            <Select
              value={gstType}
              onValueChange={(value) => setGstType(value === "yes" ? "yes" : "no")}
              disabled={isFormDisabled}
            >
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
                disabled={isFormDisabled}
              />
            </div>
          )}

          <div>
            <Label>PAN No</Label>
            <Input
              value={panNo}
              onChange={(e) => setPanNo(e.target.value.toUpperCase())}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>Opening Balance *</Label>
            <Input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
              disabled={isFormDisabled}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Address</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full address"
              rows={3}
              disabled={isFormDisabled}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Bank Details</Label>
            <Textarea
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="Bank name, Account No, IFSC, Branch"
              rows={3}
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <div>
          <Label>Active Status</Label>
          <Select
            value={isActive ? "true" : "false"}
            onValueChange={(value) => setIsActive(value === "true")}
            disabled={isFormDisabled}
          >
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
              ? "Update"
              : "Save"}
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
