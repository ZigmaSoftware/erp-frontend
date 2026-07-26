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
  customerCreationServiceApi,
  countryApi,
  stateApi,
  districtApi,
  cityApi,
  siteApi,
  itemCreationServiceApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import {
  asRecord,
  normalizeRelationId,
  pickFirstString,
  pickSiteId,
} from "@/utils/formHelpers";
import type { CustomerCreation } from "../types/salesService.types";

type Option = { value: string; label: string };

const normalizeLabel = (value: unknown): string =>
  normalizeRelationId(value).trim().toLowerCase();

const findOptionLabel = (options: Option[], value: string): string =>
  options.find((option) => option.value === value)?.label ?? "";

const getRelationLabel = (...values: unknown[]): string => {
  for (const value of values) {
    const record = asRecord(value);
    const label = record
      ? pickFirstString(record.name, record.label, record.site_name, record.unique_id, record.id)
      : pickFirstString(value);

    if (label) return label;
  }

  return "";
};

const matchesRelation = (
  record: Record<string, unknown> | undefined,
  selectedId: string,
  selectedLabel: string,
  idKeys: string[],
  labelKeys: string[],
): boolean => {
  if (!record) return false;

  const selectedIdValue = normalizeRelationId(selectedId);
  if (
    selectedIdValue &&
    idKeys.some((key) => normalizeRelationId(record[key]) === selectedIdValue)
  ) {
    return true;
  }

  const selectedLabelValue = normalizeLabel(selectedLabel);
  return Boolean(
    selectedLabelValue &&
      labelKeys.some((key) => normalizeLabel(record[key]) === selectedLabelValue),
  );
};

const appendSelectedOption = (
  options: Option[],
  selectedId: string,
  selectedLabel: string,
): Option[] => {
  if (!selectedId || options.some((option) => option.value === selectedId)) {
    return options;
  }

  return [
    ...options,
    {
      value: selectedId,
      label: selectedLabel || selectedId,
    },
  ];
};

const toOptions = (
  list: unknown[],
  getId: (item: Record<string, unknown>) => unknown,
  getLabel: (item: Record<string, unknown>) => unknown,
): Option[] =>
  list
    .map((item) => {
      const record = asRecord(item);
      return {
        value: normalizeRelationId(record ? getId(record) : undefined),
        label: normalizeRelationId(record ? getLabel(record) : undefined),
      };
    })
    .filter((option): option is Option => Boolean(option.value && option.label));

const todayValue = () => new Date().toISOString().slice(0, 10);

/* -----------------------------------------------------------
   MULTI-SELECT (sites / items)
----------------------------------------------------------- */
function MultiSelectCombobox({
  options,
  selected,
  onChange,
  disabled,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
}: {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
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
          <span className="truncate text-left">
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
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
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-1">
              {emptyMessage}
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

export default function CustomerCreationForm() {
  const [activeTab, setActiveTab] = useState<"details" | "bank">("details");

  /* ---------------- Customer Details ---------------- */
  const [entryDate, setEntryDate] = useState(todayValue());
  const [customerType, setCustomerType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const [phoneNo, setPhoneNo] = useState("");
  const [mobileCode, setMobileCode] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [otherMobile1, setOtherMobile1] = useState("");
  const [otherMobile2, setOtherMobile2] = useState("");
  const [otherMobile3, setOtherMobile3] = useState("");
  const [whatsappNo, setWhatsappNo] = useState("");

  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cityId, setCityId] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");

  const [buildingNo, setBuildingNo] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const [hasGst, setHasGst] = useState(false);
  const [gstNo, setGstNo] = useState("");

  const [toEmail, setToEmail] = useState("");
  const [ccMail, setCcMail] = useState("");
  const [qualityEmailId, setQualityEmailId] = useState("");
  const [qualityCcMail, setQualityCcMail] = useState("");

  const [openingBalance, setOpeningBalance] = useState("");
  const [paymentType, setPaymentType] = useState("");

  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [executiveName, setExecutiveName] = useState("");
  const [accGroup, setAccGroup] = useState("");

  const [nocUpload, setNocUpload] = useState(false);
  const [isActive, setIsActive] = useState(true);

  /* ---------------- Bank Details ---------------- */
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [panNo, setPanNo] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encCustomerCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encCustomerCreation}`;

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [countryList, stateList, districtList, cityList, siteList, itemList] =
          await Promise.all([
            countryApi.list(),
            stateApi.list(),
            districtApi.list(),
            cityApi.list(),
            siteApi.list(),
            itemCreationServiceApi.list(),
          ]);

        setCountries(countryList as unknown[]);
        setStates(stateList as unknown[]);
        setDistricts(districtList as unknown[]);
        setCities(cityList as unknown[]);
        setSites(siteList as unknown[]);
        setItems(itemList as unknown[]);
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
    () =>
      appendSelectedOption(
        toOptions(countries, (c) => c.unique_id ?? c.id, (c) => c.name),
        countryId,
        selectedCountryName,
      ),
    [countries, countryId, selectedCountryName],
  );

  const allStateOptions = useMemo(
    () => toOptions(states, (s) => s.unique_id ?? s.id, (s) => s.name),
    [states],
  );

  const allDistrictOptions = useMemo(
    () => toOptions(districts, (d) => d.unique_id ?? d.id, (d) => d.name),
    [districts],
  );

  const allCityOptions = useMemo(
    () => toOptions(cities, (c) => c.unique_id ?? c.id, (c) => c.name),
    [cities],
  );

  const stateOptions = useMemo(
    () =>
      appendSelectedOption(
        toOptions(
          states.filter((state) =>
            matchesRelation(
              asRecord(state),
              countryId,
              selectedCountryName,
              ["country_id", "country"],
              ["country_name"],
            ),
          ),
          (state) => state.unique_id ?? state.id,
          (state) => state.name,
        ),
        stateId,
        selectedStateName || findOptionLabel(allStateOptions, stateId),
      ),
    [states, countryId, selectedCountryName, stateId, selectedStateName, allStateOptions],
  );

  const districtOptions = useMemo(
    () =>
      appendSelectedOption(
        toOptions(
          districts.filter((district) =>
            matchesRelation(
              asRecord(district),
              stateId,
              selectedStateName,
              ["state_id", "state"],
              ["state_name"],
            ),
          ),
          (district) => district.unique_id ?? district.id,
          (district) => district.name,
        ),
        districtId,
        selectedDistrictName || findOptionLabel(allDistrictOptions, districtId),
      ),
    [districts, stateId, selectedStateName, districtId, selectedDistrictName, allDistrictOptions],
  );

  const cityOptions = useMemo(
    () =>
      appendSelectedOption(
        toOptions(
          cities.filter((city) =>
            matchesRelation(
              asRecord(city),
              districtId,
              selectedDistrictName,
              ["district_id", "district"],
              ["district_name"],
            ),
          ),
          (city) => city.unique_id ?? city.id,
          (city) => city.name,
        ),
        cityId,
        selectedCityName || findOptionLabel(allCityOptions, cityId),
      ),
    [cities, districtId, selectedDistrictName, cityId, selectedCityName, allCityOptions],
  );

  const siteOptions = useMemo(
    () => toOptions(sites, (s) => s.unique_id ?? s.id, (s) => s.site_name),
    [sites],
  );

  const itemOptions = useMemo(
    () => toOptions(items, (i) => i.unique_id ?? i.id, (i) => i.item_name),
    [items],
  );

  const selectedItemLabels = useMemo(
    () => itemOptions.filter((option) => itemIds.includes(option.value)).map((o) => o.label),
    [itemOptions, itemIds],
  );

  const selectedCountryLabel =
    findOptionLabel(countryOptions, countryId) || selectedCountryName;
  const selectedStateLabel =
    findOptionLabel(stateOptions, stateId) || selectedStateName;
  const selectedDistrictLabel =
    findOptionLabel(districtOptions, districtId) || selectedDistrictName;
  const selectedCityLabel = findOptionLabel(cityOptions, cityId) || selectedCityName;

  const renderSelectLabel = (label: string, placeholder: string) => (
    <span className={label ? "truncate text-left" : "truncate text-left text-muted-foreground"}>
      {label || placeholder}
    </span>
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await customerCreationServiceApi.get(id as string);
        const data = (res?.data || res) as CustomerCreation;
        const record = asRecord(data) ?? {};

        setEntryDate(data.entry_date ?? todayValue());
        setCustomerType(data.customer_type ?? "");
        setCustomerName(data.customer_name ?? "");
        setContactPerson(data.contact_person ?? "");

        setPhoneNo(data.phone_no ?? "");
        setMobileCode(data.mobile_code ?? "");
        setMobileNo(data.mobile_no ?? "");
        setOtherMobile1(data.other_mobile_1 ?? "");
        setOtherMobile2(data.other_mobile_2 ?? "");
        setOtherMobile3(data.other_mobile_3 ?? "");
        setWhatsappNo(data.whatsapp_no ?? "");

        setCountryId(normalizeRelationId(record.country_id ?? record.country));
        setStateId(normalizeRelationId(record.state_id ?? record.state));
        setDistrictId(normalizeRelationId(record.district_id ?? record.district));
        setCityId(normalizeRelationId(record.city_id ?? record.city));
        setSelectedCountryName(
          getRelationLabel(record.country_name, record.country_id, record.country),
        );
        setSelectedStateName(
          getRelationLabel(record.state_name, record.state_id, record.state),
        );
        setSelectedDistrictName(
          getRelationLabel(record.district_name, record.district_id, record.district),
        );
        setSelectedCityName(
          getRelationLabel(record.city_name, record.city_id, record.city),
        );

        setBuildingNo(data.building_no ?? "");
        setStreet(data.street ?? "");
        setArea(data.area ?? "");
        setPincode(data.pincode ?? "");
        setLat(data.lat ?? "");
        setLon(data.lon ?? "");

        setHasGst(Boolean(data.has_gst));
        setGstNo(data.gst_no ?? "");

        setToEmail(data.to_email ?? "");
        setCcMail(data.cc_mail ?? "");
        setQualityEmailId(data.quality_email_id ?? "");
        setQualityCcMail(data.quality_cc_mail ?? "");

        setOpeningBalance(String(data.opening_balance ?? ""));
        setPaymentType(data.payment_type ?? "");

        setSiteIds(Array.isArray(data.sites) ? data.sites.map(pickSiteId).filter(Boolean) : []);
        setItemIds(Array.isArray(data.items) ? data.items.map(normalizeRelationId).filter(Boolean) : []);
        setExecutiveName(data.executive_name ?? "");
        setAccGroup(data.acc_group ?? "");

        setNocUpload(Boolean(data.noc_upload));
        setIsActive(data.is_active ?? true);

        setBankName(data.bank_name ?? "");
        setBranch(data.branch ?? "");
        setAccountNo(data.account_no ?? "");
        setIfscCode(data.ifsc_code ?? "");
        setPanNo(data.pan_no ?? "");
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load customer",
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

    setLoading(true);

    const payload = {
      entry_date: entryDate,
      customer_type: customerType,
      customer_name: customerName.trim(),
      contact_person: contactPerson.trim(),

      phone_no: phoneNo.trim() || null,
      mobile_code: mobileCode.trim() || null,
      mobile_no: mobileNo.trim(),
      other_mobile_1: otherMobile1.trim() || null,
      other_mobile_2: otherMobile2.trim() || null,
      other_mobile_3: otherMobile3.trim() || null,
      whatsapp_no: whatsappNo.trim() || null,

      country_id: countryId,
      state_id: stateId,
      district_id: districtId,
      city_id: cityId,

      building_no: buildingNo.trim(),
      street: street.trim(),
      area: area.trim(),
      pincode: pincode.trim(),
      lat: lat.trim(),
      lon: lon.trim(),

      has_gst: hasGst,
      gst_no: hasGst ? gstNo.trim() : null,

      to_email: toEmail.trim() || null,
      cc_mail: ccMail.trim() || null,
      quality_email_id: qualityEmailId.trim() || null,
      quality_cc_mail: qualityCcMail.trim() || null,

      opening_balance: openingBalance || "0",
      payment_type: paymentType,

      sites: siteIds,
      items: itemIds,
      executive_name: executiveName.trim() || null,
      acc_group: accGroup.trim() || null,

      noc_upload: nocUpload,
      is_active: isActive,

      bank_name: bankName.trim() || null,
      branch: branch.trim() || null,
      account_no: accountNo.trim() || null,
      ifsc_code: ifscCode.trim() || null,
      pan_no: panNo.trim() || null,
    };

    try {
      if (isEdit) {
        await customerCreationServiceApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await customerCreationServiceApi.create(payload);
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

          {/* ---------------- CUSTOMER DETAILS ---------------- */}
          <div className={activeTab === "details" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "hidden"}>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Customer Type *</Label>
              <Select value={customerType} onValueChange={setCustomerType} disabled={isFormDisabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creditor">Creditor</SelectItem>
                  <SelectItem value="debitor">Debitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Customer Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
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
              <Label>Country *</Label>
              <Select
                value={countryId}
                onValueChange={(value) => {
                  if (!value) return;
                  setCountryId(value);
                  setSelectedCountryName(findOptionLabel(countryOptions, value));
                  setStateId("");
                  setDistrictId("");
                  setCityId("");
                  setSelectedStateName("");
                  setSelectedDistrictName("");
                  setSelectedCityName("");
                }}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  {renderSelectLabel(selectedCountryLabel, "Select country")}
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
                  if (!value) return;
                  setStateId(value);
                  setSelectedStateName(findOptionLabel(stateOptions, value));
                  setDistrictId("");
                  setCityId("");
                  setSelectedDistrictName("");
                  setSelectedCityName("");
                }}
                disabled={isFormDisabled || !countryId}
              >
                <SelectTrigger>
                  {renderSelectLabel(selectedStateLabel, "Select state")}
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
                  if (!value) return;
                  setDistrictId(value);
                  setSelectedDistrictName(findOptionLabel(districtOptions, value));
                  setCityId("");
                  setSelectedCityName("");
                }}
                disabled={isFormDisabled || !stateId}
              >
                <SelectTrigger>
                  {renderSelectLabel(selectedDistrictLabel, "Select district")}
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
                onValueChange={(value) => {
                  if (!value) return;
                  setCityId(value);
                  setSelectedCityName(findOptionLabel(cityOptions, value));
                }}
                disabled={isFormDisabled || !districtId}
              >
                <SelectTrigger>
                  {renderSelectLabel(selectedCityLabel, "Select city")}
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
              <div className="flex gap-2">
                <Input
                  value={mobileCode}
                  onChange={(e) => setMobileCode(e.target.value)}
                  placeholder="+91"
                  className="w-20"
                  disabled={isFormDisabled}
                />
                <Input
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="Mobile No"
                  required
                  disabled={isFormDisabled}
                />
              </div>
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
              <Label>Lat *</Label>
              <Input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Lon *</Label>
              <Input
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="Longitude"
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
              <Label>Quality To Email ID</Label>
              <Input
                type="email"
                value={qualityEmailId}
                onChange={(e) => setQualityEmailId(e.target.value)}
                placeholder="Quality Email ID"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Quality Cc Mail</Label>
              <Input
                value={qualityCcMail}
                onChange={(e) => setQualityCcMail(e.target.value)}
                placeholder="Quality Cc Mail"
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
              <MultiSelectCombobox
                options={siteOptions}
                selected={siteIds}
                onChange={setSiteIds}
                disabled={isFormDisabled}
                placeholder="Select sites"
                searchPlaceholder="Search sites..."
                emptyMessage="No sites found."
              />
            </div>

            {selectedItemLabels.length > 0 && (
              <div className="md:col-span-2">
                <Label>Selected Item List</Label>
                <p className="text-sm text-gray-600">{selectedItemLabels.join(", ")}</p>
              </div>
            )}

            <div>
              <Label>Item Name *</Label>
              <MultiSelectCombobox
                options={itemOptions}
                selected={itemIds}
                onChange={setItemIds}
                disabled={isFormDisabled}
                placeholder="Select items"
                searchPlaceholder="Search items..."
                emptyMessage="No items found."
              />
            </div>

            <div>
              <Label>Executive</Label>
              <Input
                value={executiveName}
                onChange={(e) => setExecutiveName(e.target.value)}
                placeholder="Executive"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>NOC Upload *</Label>
              <Select
                value={nocUpload ? "true" : "false"}
                onValueChange={(value) => setNocUpload(value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>A/C Group</Label>
              <Input
                value={accGroup}
                onChange={(e) => setAccGroup(e.target.value)}
                placeholder="A/C Group"
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

          {/* ---------------- CUSTOMER BANK DETAILS ---------------- */}
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
