import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronDown } from "lucide-react";

import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cityApi,
  countryApi,
  districtApi,
  icwSupplierCreationApi,
  siteApi,
  stateApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import { asRecord, normalizeRelationId } from "@/utils/formHelpers";
import type { IcwSupplierCreation } from "../types/salesMasters.types";

type Option = { value: string; label: string };

type FormState = {
  customer_date: string;
  party_type: "creditor" | "debitor" | "";
  customer_name: string;
  contact_person: string;
  country_id: string;
  state_id: string;
  district_id: string;
  city_id: string;
  phone_no: string;
  mobile_no: string;
  other_mobile_1: string;
  other_mobile_2: string;
  other_mobile_3: string;
  whatsapp_no: string;
  building_no: string;
  street: string;
  area: string;
  pincode: string;
  latitude: string;
  longitude: string;
  address: string;
  has_gst: boolean;
  gst_no: string;
  to_email: string;
  cc_mail: string;
  quality_to_email: string;
  quality_cc_mail: string;
  opening_balance: string;
  payment_type: "credit" | "debit" | "";
  sites: string[];
  item_name: string;
  executive: string;
  ac_group: string;
  noc_upload_status: boolean;
  is_active: boolean;
  bank_name: string;
  branch: string;
  account_no: string;
  ifsc_code: string;
  pan_no: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const initialForm: FormState = {
  customer_date: today(),
  party_type: "",
  customer_name: "",
  contact_person: "",
  country_id: "",
  state_id: "",
  district_id: "",
  city_id: "",
  phone_no: "",
  mobile_no: "",
  other_mobile_1: "",
  other_mobile_2: "",
  other_mobile_3: "",
  whatsapp_no: "",
  building_no: "",
  street: "",
  area: "",
  pincode: "",
  latitude: "",
  longitude: "",
  address: "",
  has_gst: false,
  gst_no: "",
  to_email: "",
  cc_mail: "",
  quality_to_email: "",
  quality_cc_mail: "",
  opening_balance: "",
  payment_type: "",
  sites: [],
  item_name: "",
  executive: "",
  ac_group: "",
  noc_upload_status: false,
  is_active: true,
  bank_name: "",
  branch: "",
  account_no: "",
  ifsc_code: "",
  pan_no: "",
};

const getString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const toOptions = (
  list: unknown[],
  valueKey: string,
  labelKey: string,
): Option[] =>
  list
    .map((item) => {
      const record = asRecord(item);
      return {
        value: getString(record?.[valueKey]),
        label: getString(record?.[labelKey]),
      };
    })
    .filter((option) => option.value && option.label);

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

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate text-left text-muted-foreground">
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : "Select"}
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sites..."
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {filtered.map((option) => (
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
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              No sites found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function IcwSupplierCreationForm() {
  const [activeTab, setActiveTab] = useState<"details" | "bank">("details");
  const [form, setForm] = useState<FormState>(initialForm);
  const [countries, setCountries] = useState<unknown[]>([]);
  const [states, setStates] = useState<unknown[]>([]);
  const [districts, setDistricts] = useState<unknown[]>([]);
  const [cities, setCities] = useState<unknown[]>([]);
  const [sites, setSites] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesMasters, encIcwSupplierCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesMasters}/${encIcwSupplierCreation}`;

  const updateField = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await icwSupplierCreationApi.get(id as string);
        const data = (res?.data || res) as IcwSupplierCreation;
        setForm({
          customer_date: data.customer_date ?? today(),
          party_type: data.party_type ?? "",
          customer_name: data.customer_name ?? "",
          contact_person: data.contact_person ?? "",
          country_id: normalizeRelationId(data.country_id),
          state_id: normalizeRelationId(data.state_id),
          district_id: normalizeRelationId(data.district_id),
          city_id: normalizeRelationId(data.city_id),
          phone_no: data.phone_no ?? "",
          mobile_no: data.mobile_no ?? "",
          other_mobile_1: data.other_mobile_1 ?? "",
          other_mobile_2: data.other_mobile_2 ?? "",
          other_mobile_3: data.other_mobile_3 ?? "",
          whatsapp_no: data.whatsapp_no ?? "",
          building_no: data.building_no ?? "",
          street: data.street ?? "",
          area: data.area ?? "",
          pincode: data.pincode ?? "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
          address: data.address ?? "",
          has_gst: Boolean(data.has_gst),
          gst_no: data.gst_no ?? "",
          to_email: data.to_email ?? "",
          cc_mail: data.cc_mail ?? "",
          quality_to_email: data.quality_to_email ?? "",
          quality_cc_mail: data.quality_cc_mail ?? "",
          opening_balance: String(data.opening_balance ?? ""),
          payment_type: data.payment_type ?? "",
          sites: Array.isArray(data.sites) ? data.sites : [],
          item_name: data.item_name ?? "",
          executive: data.executive ?? "",
          ac_group: data.ac_group ?? "",
          noc_upload_status: Boolean(data.noc_upload_status),
          is_active: data.is_active ?? true,
          bank_name: data.bank_name ?? "",
          branch: data.branch ?? "",
          account_no: data.account_no ?? "",
          ifsc_code: data.ifsc_code ?? "",
          pan_no: data.pan_no ?? "",
        });
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load ICW supplier",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  const countryOptions = useMemo(
    () => toOptions(countries, "unique_id", "name"),
    [countries],
  );

  const stateOptions = useMemo(
    () =>
      toOptions(
        states.filter(
          (state) => normalizeRelationId(asRecord(state)?.country_id) === form.country_id,
        ),
        "unique_id",
        "name",
      ),
    [states, form.country_id],
  );

  const districtOptions = useMemo(
    () =>
      toOptions(
        districts.filter(
          (district) =>
            normalizeRelationId(asRecord(district)?.state_id) === form.state_id,
        ),
        "unique_id",
        "name",
      ),
    [districts, form.state_id],
  );

  const cityOptions = useMemo(
    () =>
      toOptions(
        cities.filter(
          (city) => normalizeRelationId(asRecord(city)?.district_id) === form.district_id,
        ),
        "unique_id",
        "name",
      ),
    [cities, form.district_id],
  );

  const siteOptions = useMemo(
    () => toOptions(sites, "unique_id", "site_name"),
    [sites],
  );

  const validate = () => {
    const detailFields: Array<[keyof FormState, string]> = [
      ["customer_date", "Date"],
      ["party_type", "Customer Type"],
      ["customer_name", "Customer Name"],
      ["contact_person", "Contact Person"],
      ["country_id", "Country"],
      ["state_id", "State"],
      ["district_id", "District"],
      ["city_id", "City"],
      ["mobile_no", "Mobile No"],
      ["building_no", "Building No."],
      ["street", "Street"],
      ["area", "Area"],
      ["pincode", "Pincode"],
      ["latitude", "Lat"],
      ["longitude", "Lon"],
      ["opening_balance", "Opening Balance"],
      ["payment_type", "Payment Type"],
      ["item_name", "Item Name"],
      ["executive", "Executive"],
    ];

    for (const [key, label] of detailFields) {
      if (!String(form[key] ?? "").trim()) {
        setActiveTab("details");
        return `${label} is required.`;
      }
    }

    if (form.sites.length === 0) {
      setActiveTab("details");
      return "Site is required.";
    }

    if (form.has_gst && !form.gst_no.trim()) {
      setActiveTab("details");
      return "GST Number is required when GST No is Yes.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Validation failed",
        text: validationError,
      });
      return;
    }

    setLoading(true);
    const payload = {
      ...form,
      opening_balance: form.opening_balance || "0",
      gst_no: form.has_gst ? form.gst_no.trim() : "",
    };

    try {
      if (isEdit) {
        await icwSupplierCreationApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await icwSupplierCreationApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      navigate(ENC_LIST_PATH);
    } catch (error: unknown) {
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
      <ComponentCard title={isEdit ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="flex border-b">
            <button
              type="button"
              className={tabButtonClass("details")}
              onClick={() => setActiveTab("details")}
            >
              Customer Details
            </button>
            <button
              type="button"
              className={tabButtonClass("bank")}
              onClick={() => setActiveTab("bank")}
            >
              Customer Bank Details
            </button>
          </div>

          <div
            className={
              activeTab === "details"
                ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                : "hidden"
            }
          >
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.customer_date}
                onChange={(event) => updateField("customer_date", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Customer Type *</Label>
              <Select
                value={form.party_type || undefined}
                onValueChange={(value) =>
                  updateField("party_type", value as FormState["party_type"])
                }
                disabled={isFormDisabled}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="creditor">Creditor</SelectItem>
                  <SelectItem value="debitor">Debitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={form.customer_name}
                onChange={(event) => updateField("customer_name", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Contact Person *</Label>
              <Input
                value={form.contact_person}
                onChange={(event) => updateField("contact_person", event.target.value)}
                placeholder="Contact Person"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Country *</Label>
              <Select
                value={form.country_id || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    country_id: value,
                    state_id: "",
                    district_id: "",
                    city_id: "",
                  }))
                }
                disabled={isFormDisabled}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                value={form.state_id || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    state_id: value,
                    district_id: "",
                    city_id: "",
                  }))
                }
                disabled={isFormDisabled || !form.country_id}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                value={form.district_id || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, district_id: value, city_id: "" }))
                }
                disabled={isFormDisabled || !form.state_id}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                value={form.city_id || undefined}
                onValueChange={(value) => updateField("city_id", value)}
                disabled={isFormDisabled || !form.district_id}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <Label>Phone No</Label>
              <Input
                value={form.phone_no}
                onChange={(event) => updateField("phone_no", event.target.value)}
                placeholder="Phone No"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Mobile No *</Label>
              <Input
                value={form.mobile_no}
                onChange={(event) => updateField("mobile_no", event.target.value)}
                placeholder="Mobile No"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Other Mobile1</Label>
              <Input
                value={form.other_mobile_1}
                onChange={(event) => updateField("other_mobile_1", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Other Mobile2</Label>
              <Input
                value={form.other_mobile_2}
                onChange={(event) => updateField("other_mobile_2", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Other Mobile3</Label>
              <Input
                value={form.other_mobile_3}
                onChange={(event) => updateField("other_mobile_3", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>WhatsApp No</Label>
              <Input
                value={form.whatsapp_no}
                onChange={(event) => updateField("whatsapp_no", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Building No. *</Label>
              <Input
                value={form.building_no}
                onChange={(event) => updateField("building_no", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Street *</Label>
              <Input
                value={form.street}
                onChange={(event) => updateField("street", event.target.value)}
                placeholder="Street"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Area *</Label>
              <Input
                value={form.area}
                onChange={(event) => updateField("area", event.target.value)}
                placeholder="Area"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Pincode *</Label>
              <Input
                value={form.pincode}
                onChange={(event) => updateField("pincode", event.target.value)}
                placeholder="Pincode"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Lat *</Label>
              <Input
                value={form.latitude}
                onChange={(event) => updateField("latitude", event.target.value)}
                placeholder="Latitude"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Lon *</Label>
              <Input
                value={form.longitude}
                onChange={(event) => updateField("longitude", event.target.value)}
                placeholder="Longitude"
                disabled={isFormDisabled}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <textarea
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>GST No *</Label>
              <RadioGroup
                value={form.has_gst ? "yes" : "no"}
                onValueChange={(value) => updateField("has_gst", value === "yes")}
                className="flex items-center gap-6 h-10"
                disabled={isFormDisabled}
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="yes" /> Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="no" /> No
                </label>
              </RadioGroup>
            </div>
            {form.has_gst && (
              <div>
                <Label>GST Number *</Label>
                <Input
                  value={form.gst_no}
                  onChange={(event) => updateField("gst_no", event.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            )}
            <div>
              <Label>To Email ID</Label>
              <Input
                type="email"
                value={form.to_email}
                onChange={(event) => updateField("to_email", event.target.value)}
                placeholder="Email ID"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Cc Mail</Label>
              <Input
                value={form.cc_mail}
                onChange={(event) => updateField("cc_mail", event.target.value)}
                placeholder="Cc Mail"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Quality To Email ID</Label>
              <Input
                type="email"
                value={form.quality_to_email}
                onChange={(event) =>
                  updateField("quality_to_email", event.target.value)
                }
                placeholder="Quality Email ID"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Quality Cc Mail</Label>
              <Input
                value={form.quality_cc_mail}
                onChange={(event) => updateField("quality_cc_mail", event.target.value)}
                placeholder="Quality Cc Mail"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Opening Balance *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.opening_balance}
                onChange={(event) => updateField("opening_balance", event.target.value)}
                placeholder="Opening Balance"
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Payment Type *</Label>
              <Select
                value={form.payment_type || undefined}
                onValueChange={(value) =>
                  updateField("payment_type", value as FormState["payment_type"])
                }
                disabled={isFormDisabled}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                selected={form.sites}
                onChange={(values) => updateField("sites", values)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Item Name *</Label>
              <Input
                value={form.item_name}
                onChange={(event) => updateField("item_name", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>Executive *</Label>
              <Input
                value={form.executive}
                onChange={(event) => updateField("executive", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>A/C Group</Label>
              <Input
                value={form.ac_group}
                onChange={(event) => updateField("ac_group", event.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <div>
              <Label>NOC Upload *</Label>
              <Select
                value={form.noc_upload_status ? "true" : "false"}
                onValueChange={(value) =>
                  updateField("noc_upload_status", value === "true")
                }
                disabled={isFormDisabled}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Active Status *</Label>
              <Select
                value={form.is_active ? "true" : "false"}
                onValueChange={(value) => updateField("is_active", value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={
              activeTab === "bank"
                ? "grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-8 gap-y-8 items-center"
                : "hidden"
            }
          >
            <Label className="text-lg font-semibold text-gray-500">Bank Name</Label>
            <Input
              value={form.bank_name}
              onChange={(event) => updateField("bank_name", event.target.value)}
              disabled={isFormDisabled}
            />
            <Label className="text-lg font-semibold text-gray-500">Branch</Label>
            <Input
              value={form.branch}
              onChange={(event) => updateField("branch", event.target.value)}
              disabled={isFormDisabled}
            />
            <Label className="text-lg font-semibold text-gray-500">Account No</Label>
            <Input
              value={form.account_no}
              onChange={(event) => updateField("account_no", event.target.value)}
              disabled={isFormDisabled}
            />
            <Label className="text-lg font-semibold text-gray-500">IFSC Code</Label>
            <Input
              value={form.ifsc_code}
              onChange={(event) => updateField("ifsc_code", event.target.value)}
              disabled={isFormDisabled}
            />
            <Label className="text-lg font-semibold text-gray-500">PAN No</Label>
            <Input
              value={form.pan_no}
              onChange={(event) => updateField("pan_no", event.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate(ENC_LIST_PATH)}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
