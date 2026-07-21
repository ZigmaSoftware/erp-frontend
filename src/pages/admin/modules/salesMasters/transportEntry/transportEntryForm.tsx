import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronDown } from "lucide-react";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  transportEntryApi,
  countryApi,
  stateApi,
  districtApi,
  cityApi,
  siteApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { TransportEntry } from "../types/salesMasters.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

/* -----------------------------------------------------------
   MULTI-SELECT (sites)
----------------------------------------------------------- */
function SiteMultiSelect({
  options,
  selected,
  onChange,
  disabled,
}: {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate text-left text-muted-foreground data-[has-value=true]:text-foreground">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : "Select sites"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="p-2 border-b">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites..."
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-1">
              No sites found.
            </div>
          ) : (
            filtered.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                {option.label}
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function TransportEntryForm() {
  const [activeTab, setActiveTab] = useState<"details" | "bank">("details");

  /* ---------------- Transport Details ---------------- */
  const [transportDate, setTransportDate] = useState("");
  const [transportType, setTransportType] = useState("");
  const [transportName, setTransportName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [otherMobile1, setOtherMobile1] = useState("");
  const [otherMobile2, setOtherMobile2] = useState("");
  const [otherMobile3, setOtherMobile3] = useState("");
  const [whatsappNo, setWhatsappNo] = useState("");

  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");

  const [buildingNo, setBuildingNo] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");

  const [hasGst, setHasGst] = useState(false);
  const [gstNo, setGstNo] = useState("");

  const [toEmail, setToEmail] = useState("");
  const [ccMail, setCcMail] = useState("");

  const [openingBalance, setOpeningBalance] = useState("");
  const [paymentType, setPaymentType] = useState("");

  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [targetLimit, setTargetLimit] = useState("");
  const [isActive, setIsActive] = useState(true);

  /* ---------------- Bank Details ---------------- */
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [panNo, setPanNo] = useState("");
  const [tds, setTds] = useState(false);
  const [tdsDocumentFile, setTdsDocumentFile] = useState<File | null>(null);
  const [existingTdsDocument, setExistingTdsDocument] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesMasters, encTransportMaster } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesMasters}/${encTransportMaster}`;

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [countryList, stateList, districtList, cityList, siteList] =
          await Promise.all([
            countryApi.list(),
            stateApi.list(),
            districtApi.list(),
            cityApi.list(),
            siteApi.list(),
          ]);

        setCountries(countryList as unknown[]);
        setStates(stateList as unknown[]);
        setDistricts(districtList as unknown[]);
        setCities(cityList as unknown[]);
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

  const countryOptions = useMemo(
    () => toOptions(countries, (c) => c.unique_id, (c) => c.name),
    [countries],
  );

  const stateOptions = useMemo(
    () =>
      toOptions(
        states.filter((s) => s.country_id === countryId),
        (s) => s.unique_id,
        (s) => s.name,
      ),
    [states, countryId],
  );

  const districtOptions = useMemo(
    () =>
      toOptions(
        districts.filter((d) => d.state_id === stateId),
        (d) => d.unique_id,
        (d) => d.name,
      ),
    [districts, stateId],
  );

  const cityOptions = useMemo(
    () =>
      toOptions(
        cities.filter((c) => c.district_id === districtId),
        (c) => c.unique_id,
        (c) => c.name,
      ),
    [cities, districtId],
  );

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
        const res = await transportEntryApi.get(id as string);
        const data = (res?.data || res) as TransportEntry;

        setTransportDate(data.transport_date ?? "");
        setTransportType(data.transport_type ?? "");
        setTransportName(data.transport_name ?? "");
        setContactPerson(data.contact_person ?? "");
        setPhoneNo(data.phone_no ?? "");
        setMobileNo(data.mobile_no ?? "");
        setOtherMobile1(data.other_mobile_1 ?? "");
        setOtherMobile2(data.other_mobile_2 ?? "");
        setOtherMobile3(data.other_mobile_3 ?? "");
        setWhatsappNo(data.whatsapp_no ?? "");

        setCountryId(data.country_id ?? "");
        setStateId(data.state_id ?? "");
        setDistrictId(data.district_id ?? "");
        setCityId(data.city_id ?? "");

        setBuildingNo(data.building_no ?? "");
        setStreet(data.street ?? "");
        setArea(data.area ?? "");
        setPincode(data.pincode ?? "");

        setHasGst(Boolean(data.has_gst));
        setGstNo(data.gst_no ?? "");

        setToEmail(data.to_email ?? "");
        setCcMail(data.cc_mail ?? "");

        setOpeningBalance(String(data.opening_balance ?? ""));
        setPaymentType(data.payment_type ?? "");

        setSiteIds(Array.isArray(data.sites) ? data.sites : []);
        setTargetLimit(String(data.target_limit ?? ""));
        setIsActive(data.is_active ?? true);

        setBankName(data.bank_name ?? "");
        setBranch(data.branch ?? "");
        setAccountNo(data.account_no ?? "");
        setIfscCode(data.ifsc_code ?? "");
        setPanNo(data.pan_no ?? "");
        setTds(Boolean(data.tds));
        setExistingTdsDocument(data.tds_document ?? "");
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load transport entry",
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
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (hasGst && !gstNo.trim()) {
      setActiveTab("details");
      Swal.fire({
        icon: "error",
        title: "GST No. is required",
        text: "Please enter the GST number or set GST to No.",
      });
      return;
    }

    if (tds && !tdsDocumentFile && !existingTdsDocument) {
      setActiveTab("bank");
      Swal.fire({
        icon: "error",
        title: "TDS document is required",
        text: "Please upload the TDS document or set TDS to No.",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("transport_date", transportDate);
    formData.append("transport_type", transportType);
    formData.append("transport_name", transportName.trim());
    formData.append("contact_person", contactPerson.trim());
    formData.append("phone_no", phoneNo.trim());
    formData.append("mobile_no", mobileNo.trim());
    formData.append("other_mobile_1", otherMobile1.trim());
    formData.append("other_mobile_2", otherMobile2.trim());
    formData.append("other_mobile_3", otherMobile3.trim());
    formData.append("whatsapp_no", whatsappNo.trim());

    formData.append("country_id", countryId);
    formData.append("state_id", stateId);
    formData.append("district_id", districtId);
    formData.append("city_id", cityId);

    formData.append("building_no", buildingNo.trim());
    formData.append("street", street.trim());
    formData.append("area", area.trim());
    formData.append("pincode", pincode.trim());

    formData.append("has_gst", String(hasGst));
    formData.append("gst_no", hasGst ? gstNo.trim() : "");

    formData.append("to_email", toEmail.trim());
    formData.append("cc_mail", ccMail.trim());

    formData.append("opening_balance", openingBalance || "0");
    formData.append("payment_type", paymentType);

    siteIds.forEach((siteUniqueId) => formData.append("sites", siteUniqueId));

    formData.append("target_limit", targetLimit || "0");
    formData.append("is_active", String(isActive));

    formData.append("bank_name", bankName.trim());
    formData.append("branch", branch.trim());
    formData.append("account_no", accountNo.trim());
    formData.append("ifsc_code", ifscCode.trim());
    formData.append("pan_no", panNo.trim());
    formData.append("tds", String(tds));

    if (tdsDocumentFile) {
      formData.append("tds_document", tdsDocumentFile);
    }

    try {
      if (isEdit) {
        await transportEntryApi.update(id as string, formData);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await transportEntryApi.create(formData);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error) {
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

  const tabButtonClass = (tab: "details" | "bank") =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? "border-green-600 text-green-700"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Transport Entry" : "Add New Transport Entry"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="flex border-b">
            <button
              type="button"
              className={tabButtonClass("details")}
              onClick={() => setActiveTab("details")}
            >
              Transport Details
            </button>
            <button
              type="button"
              className={tabButtonClass("bank")}
              onClick={() => setActiveTab("bank")}
            >
              Transport Bank Details
            </button>
          </div>

          {/* ---------------- TRANSPORT DETAILS ---------------- */}
          <div className={activeTab === "details" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "hidden"}>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={transportDate}
                onChange={(e) => setTransportDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Transport Type *</Label>
              <Select value={transportType} onValueChange={setTransportType} disabled={isFormDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transport type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creditor">Creditor</SelectItem>
                  <SelectItem value="debitor">Debitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Transport Name *</Label>
              <Input
                value={transportName}
                onChange={(e) => setTransportName(e.target.value)}
                placeholder="Transport Name"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Contact Person *</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact Person"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Phone No</Label>
              <Input
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                placeholder="Phone No"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Mobile No *</Label>
              <Input
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="Mobile No"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Other Mobile 1</Label>
              <Input
                value={otherMobile1}
                onChange={(e) => setOtherMobile1(e.target.value)}
                placeholder="Other Mobile 1"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Other Mobile 2</Label>
              <Input
                value={otherMobile2}
                onChange={(e) => setOtherMobile2(e.target.value)}
                placeholder="Other Mobile 2"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Other Mobile 3</Label>
              <Input
                value={otherMobile3}
                onChange={(e) => setOtherMobile3(e.target.value)}
                placeholder="Other Mobile 3"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>WhatsApp No</Label>
              <Input
                value={whatsappNo}
                onChange={(e) => setWhatsappNo(e.target.value)}
                placeholder="WhatsApp No"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Country *</Label>
              <Select
                value={countryId}
                onValueChange={(value) => {
                  setCountryId(value);
                  setStateId("");
                  setDistrictId("");
                  setCityId("");
                }}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>State *</Label>
              <Select
                value={stateId}
                onValueChange={(value) => {
                  setStateId(value);
                  setDistrictId("");
                  setCityId("");
                }}
                disabled={isFormDisabled || !countryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {stateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>District *</Label>
              <Select
                value={districtId}
                onValueChange={(value) => {
                  setDistrictId(value);
                  setCityId("");
                }}
                disabled={isFormDisabled || !stateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districtOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>City *</Label>
              <Select
                value={cityId}
                onValueChange={setCityId}
                disabled={isFormDisabled || !districtId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Building No. *</Label>
              <Input
                value={buildingNo}
                onChange={(e) => setBuildingNo(e.target.value)}
                placeholder="Building No."
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Street *</Label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Area *</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Area"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Pincode *</Label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>GST No *</Label>
              <RadioGroup
                value={hasGst ? "yes" : "no"}
                onValueChange={(value) => setHasGst(value === "yes")}
                disabled={isFormDisabled}
                className="flex items-center gap-6 h-10"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="yes" /> Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="no" /> No
                </label>
              </RadioGroup>
            </div>

            {hasGst && (
              <div>
                <Label>GST Number *</Label>
                <Input
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  placeholder="GST Number"
                  required
                  disabled={isFormDisabled}
                />
              </div>
            )}

            <div>
              <Label>To Email ID</Label>
              <Input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="Email ID"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Cc Mail</Label>
              <Input
                value={ccMail}
                onChange={(e) => setCcMail(e.target.value)}
                placeholder="Cc Mail"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Opening Balance *</Label>
              <Input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="Opening Balance"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Payment Type *</Label>
              <Select value={paymentType} onValueChange={setPaymentType} disabled={isFormDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Site *</Label>
              <SiteMultiSelect
                options={siteOptions}
                selected={siteIds}
                onChange={setSiteIds}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Target Limit *</Label>
              <Input
                type="number"
                step="0.01"
                value={targetLimit}
                onChange={(e) => setTargetLimit(e.target.value)}
                placeholder="Target Limit"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Active Status *</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(value) => setIsActive(value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ---------------- TRANSPORT BANK DETAILS ---------------- */}
          <div className={activeTab === "bank" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "hidden"}>
            <div>
              <Label>Bank Name</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Branch</Label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Account No</Label>
              <Input
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="Account No"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>IFSC Code</Label>
              <Input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                placeholder="IFSC Code"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>PAN No</Label>
              <Input
                value={panNo}
                onChange={(e) => setPanNo(e.target.value)}
                placeholder="PAN No"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>TDS *</Label>
              <RadioGroup
                value={tds ? "yes" : "no"}
                onValueChange={(value) => setTds(value === "yes")}
                disabled={isFormDisabled}
                className="flex items-center gap-6 h-10"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="yes" /> Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="no" /> No
                </label>
              </RadioGroup>
            </div>

            {tds && (
              <div className="md:col-span-2">
                <Label>TDS Document {existingTdsDocument ? "" : "*"}</Label>
                <input
                  type="file"
                  onChange={(e) => setTdsDocumentFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
                  disabled={isFormDisabled}
                />
                {existingTdsDocument && !tdsDocumentFile && (
                  <a
                    href={existingTdsDocument}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-blue-600 underline"
                  >
                    View uploaded document
                  </a>
                )}
              </div>
            )}
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
