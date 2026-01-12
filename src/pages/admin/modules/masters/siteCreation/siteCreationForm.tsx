import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { districtApi, siteApi, stateApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

/* ---------------- TYPES ---------------- */

type FieldConfig = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  as?: "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  step?: string;
};

type SectionConfig = {
  title: string;
  fields: FieldConfig[];
};

type FormValues = Record<string, string>;
type FileValues = Record<string, File | null>;

/* ---------------- CONFIG ---------------- */

const fileFieldNames = new Set(["verification_document", "document_view"]);

const mapLocationOptions = (items: any[]) =>
  (items ?? [])
    .filter((item) => item?.name && item.is_active !== false)
    .map((item) => ({
      value: String(item.unique_id ?? item.id ?? item.name),
      label: item.name,
    }));

const normalizeStatusLabel = (value: string) =>
  value?.toLowerCase() === "active" ? "Active" : "Inactive";

const resolveOptionValue = (
  value: string,
  options: Array<{ value: string; label: string }>
) => {
  if (!value) return "";
  const direct = options.find((opt) => opt.value === value);
  if (direct) return direct.value;
  const byLabel = options.find((opt) => opt.label === value);
  return byLabel ? byLabel.value : value;
};

const coerceString = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const toNumberValue = (value: string) => (value === "" ? "" : Number(value));

/* ---------------- SECTIONS ---------------- */

const sections: SectionConfig[] = [
  {
    title: "Core Site & Location",
    fields: [
      { label: "Site Name", name: "site_name", placeholder: "Enter site name" },
      { label: "State", name: "state_id", as: "select" },
      { label: "District", name: "district_id", as: "select" },
      { label: "ULB", name: "ulb", placeholder: "Enter ULB" },
      {
        label: "Status",
        name: "status",
        as: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
      {
        label: "Site Address",
        name: "site_address",
        as: "textarea",
        placeholder: "Enter full site address",
      },
    ],
  },
  {
    title: "Geo Location",
    fields: [
      {
        label: "Latitude",
        name: "latitude",
        type: "number",
        step: "0.000001",
        placeholder: "e.g. 12.971598",
      },
      {
        label: "Longitude",
        name: "longitude",
        type: "number",
        step: "0.000001",
        placeholder: "e.g. 77.594566",
      },
    ],
  },
  {
    title: "Project & Commercial",
    fields: [
      {
        label: "Project Value",
        name: "project_value",
        type: "number",
        step: "0.01",
        placeholder: "0.00",
      },
      {
        label: "Project Type Details",
        name: "project_type_details",
        placeholder: "Enter project type details",
      },
      {
        label: "Basic Payment per m3",
        name: "basic_payment_per_m3",
        type: "number",
        step: "0.01",
        placeholder: "0.00",
      },
      {
        label: "DC Invoice No",
        name: "dc_invoice_no",
        placeholder: "Enter invoice number",
      },
      {
        label: "Min/Max Type",
        name: "min_max_type",
        placeholder: "Enter min/max type",
      },
      {
        label: "Screen Name",
        name: "screen_name",
        placeholder: "Enter screen name",
      },
      {
        label: "Weighbridge Count",
        name: "weighbridge_count",
        type: "number",
        step: "1",
        placeholder: "0",
      },
    ],
  },
  {
    title: "Electrical / Utility",
    fields: [
      { label: "EB Rate", name: "eb_rate", type: "number", step: "0.01" },
      {
        label: "Unit per Cost",
        name: "unit_per_cost",
        type: "number",
        step: "0.01",
      },
      { label: "kWh", name: "kwh", type: "number", step: "0.01" },
      {
        label: "Demand Cost",
        name: "demand_cost",
        type: "number",
        step: "0.01",
      },
      { label: "EB Start Date", name: "eb_start_date", type: "date" },
      { label: "EB End Date", name: "eb_end_date", type: "date" },
    ],
  },
  {
    title: "Zone / Capacity",
    fields: [
      { label: "No. of Zones", name: "no_of_zones", type: "number", step: "1" },
      {
        label: "No. of Phases",
        name: "no_of_phases",
        type: "number",
        step: "1",
      },
      {
        label: "Density Volume",
        name: "density_volume",
        type: "number",
        step: "0.01",
      },
      {
        label: "Extended Quantity",
        name: "extended_quantity",
        type: "number",
        step: "0.01",
      },
    ],
  },
  {
    title: "Charges",
    fields: [
      {
        label: "Service Charge",
        name: "service_charge",
        type: "number",
        step: "0.01",
      },
      {
        label: "Transportation Cost",
        name: "transportation_cost",
        type: "number",
        step: "0.01",
      },
    ],
  },
  {
    title: "Bank & GST",
    fields: [
      { label: "GST", name: "gst", placeholder: "Enter GST number" },
      { label: "Bank Name", name: "bank_name", placeholder: "Enter bank name" },
      {
        label: "Account Number",
        name: "account_number",
        placeholder: "Enter account number",
      },
      { label: "IFSC Code", name: "ifsc_code", placeholder: "Enter IFSC code" },
      {
        label: "Bank Address",
        name: "bank_address",
        as: "textarea",
        placeholder: "Enter bank address",
      },
    ],
  },
  {
    title: "Project Lifecycle Dates",
    fields: [
      {
        label: "Erection Start Date",
        name: "erection_start_date",
        type: "date",
      },
      {
        label: "Commissioning Start Date",
        name: "commissioning_start_date",
        type: "date",
      },
      {
        label: "Project Completion Date",
        name: "project_completion_date",
        type: "date",
      },
    ],
  },
  {
    title: "Documents",
    fields: [
      {
        label: "Weighment Folder Name",
        name: "weighment_folder_name",
        placeholder: "Enter folder name",
      },
      {
        label: "Verification Document",
        name: "verification_document",
        type: "file",
      },
      { label: "Document View", name: "document_view", type: "file" },
    ],
  },
  {
    title: "Financial / Change",
    fields: [
      {
        label: "Petty Cash",
        name: "petty_cash",
        type: "number",
        step: "0.01",
      },
      {
        label: "Proposed Change",
        name: "proposed_change",
        as: "textarea",
        placeholder: "Enter proposed change",
      },
      {
        label: "Remarks",
        name: "remarks",
        as: "textarea",
        placeholder: "Enter remarks",
      },
    ],
  },
];

/* ---------------- HELPERS ---------------- */

const buildInitialFormData = () =>
  sections.reduce<FormValues>((acc, section) => {
    section.fields.forEach((field) => {
      acc[field.name] = "";
    });
    return acc;
  }, {});

const buildInitialFileValues = () =>
  Array.from(fileFieldNames).reduce<FileValues>((acc, key) => {
    acc[key] = null;
    return acc;
  }, {});

/* ---------------- FIELD RENDER ---------------- */

const renderField = (
  field: FieldConfig,
  value: string,
  onChange: (name: string, value: string) => void,
  onFileChange: (name: string, file: File | null) => void,
  options?: Array<{ value: string; label: string }>
) => {
  const safeValue = value ?? "";

  if (field.as === "textarea") {
    return (
      <Textarea
        id={field.name}
        value={safeValue}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    );
  }

  if (field.as === "select") {
    return (
      <Select
        value={safeValue}
        onValueChange={(v) => onChange(field.name, v)}
      >
        <SelectTrigger id={field.name}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {(options || field.options || []).map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "file") {
    return (
      <Input
        id={field.name}
        type="file"
        onChange={(e) =>
          onFileChange(field.name, e.target.files?.[0] || null)
        }
      />
    );
  }

  return (
    <Input
      id={field.name}
      type={field.type || "text"}
      value={safeValue}
      placeholder={field.placeholder}
      step={field.step}
      onChange={(e) => onChange(field.name, e.target.value)}
    />
  );
};

/* ---------------- COMPONENT ---------------- */

export default function SiteCreationForm() {
  const [formData, setFormData] = useState<FormValues>(buildInitialFormData);
  const [fileInputs, setFileInputs] = useState<FileValues>(buildInitialFileValues);
  const [loading, setLoading] = useState(false);

  const [stateOptions, setStateOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [districtOptions, setDistrictOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encMasters, encSiteCreation } = getEncryptedRoute();
  const LIST_PATH = `/${encMasters}/${encSiteCreation}`;

  /* -------- DROPDOWNS -------- */

  useEffect(() => {
    (async () => {
      const states = await stateApi.list();
      const districts = await districtApi.list();
      setStateOptions(mapLocationOptions(states));
      setDistrictOptions(mapLocationOptions(districts));
    })();
  }, []);

  useEffect(() => {
    setFormData((prev) => {
      const next = { ...prev };
      if (stateOptions.length) {
        const resolved = resolveOptionValue(prev.state_id, stateOptions);
        if (resolved !== prev.state_id) next.state_id = resolved;
      }
      if (districtOptions.length) {
        const resolved = resolveOptionValue(prev.district_id, districtOptions);
        if (resolved !== prev.district_id) next.district_id = resolved;
      }
      return next;
    });
  }, [stateOptions, districtOptions]);

  /* -------- EDIT MODE -------- */

  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      const site = await siteApi.get(id!);

      setFormData({
        site_name: coerceString(site.site_name),
        state_id: resolveOptionValue(coerceString(site.state_id), stateOptions),
        district_id: resolveOptionValue(
          coerceString(site.district_id),
          districtOptions
        ),
        ulb: coerceString(site.ulb),
        site_address: coerceString(site.site_address),
        status: site.status
          ? normalizeStatusLabel(coerceString(site.status))
          : site.is_active !== undefined
          ? site.is_active
            ? "Active"
            : "Inactive"
          : "",
        latitude: coerceString(site.latitude),
        longitude: coerceString(site.longitude),
        project_value: coerceString(site.project_value),
        project_type_details: coerceString(site.project_type_details),
        basic_payment_per_m3: coerceString(site.basic_payment_per_m3),
        dc_invoice_no: coerceString(site.dc_invoice_no),
        min_max_type: coerceString(site.min_max_type),
        screen_name: coerceString(site.screen_name),
        weighbridge_count: coerceString(site.weighbridge_count),
        eb_rate: coerceString(site.eb_rate),
        unit_per_cost: coerceString(site.unit_per_cost),
        kwh: coerceString(site.kwh),
        demand_cost: coerceString(site.demand_cost),
        eb_start_date: coerceString(site.eb_start_date),
        eb_end_date: coerceString(site.eb_end_date),
        no_of_zones: coerceString(site.no_of_zones),
        no_of_phases: coerceString(site.no_of_phases),
        density_volume: coerceString(site.density_volume),
        extended_quantity: coerceString(site.extended_quantity),
        service_charge: coerceString(site.service_charge),
        transportation_cost: coerceString(site.transportation_cost),
        gst: coerceString(site.gst),
        bank_name: coerceString(site.bank_name),
        account_number: coerceString(site.account_number),
        ifsc_code: coerceString(site.ifsc_code),
        bank_address: coerceString(site.bank_address),
        erection_start_date: coerceString(site.erection_start_date),
        commissioning_start_date: coerceString(site.commissioning_start_date),
        project_completion_date: coerceString(site.project_completion_date),
        weighment_folder_name: coerceString(site.weighment_folder_name),
        verification_document: "",
        document_view: "",
        petty_cash: coerceString(site.petty_cash),
        proposed_change: coerceString(site.proposed_change),
        remarks: coerceString(site.remarks),
      });
    })();
  }, [id, isEdit, stateOptions, districtOptions]);

  /* -------- HANDLERS -------- */

  const handleChange = (name: string, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleFileChange = (name: string, file: File | null) =>
    setFileInputs((prev) => ({ ...prev, [name]: file }));

  /* -------- SUBMIT -------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      site_name: formData.site_name,
      state_id: formData.state_id,
      district_id: formData.district_id,
      ulb: formData.ulb,
      site_address: formData.site_address,
      status: formData.status,
      is_active: formData.status ? formData.status === "Active" : undefined,
      latitude: toNumberValue(formData.latitude),
      longitude: toNumberValue(formData.longitude),
      project_value: toNumberValue(formData.project_value),
      project_type_details: formData.project_type_details,
      basic_payment_per_m3: toNumberValue(formData.basic_payment_per_m3),
      dc_invoice_no: formData.dc_invoice_no,
      min_max_type: formData.min_max_type,
      screen_name: formData.screen_name,
      weighbridge_count: toNumberValue(formData.weighbridge_count),
      eb_rate: toNumberValue(formData.eb_rate),
      unit_per_cost: toNumberValue(formData.unit_per_cost),
      kwh: toNumberValue(formData.kwh),
      demand_cost: toNumberValue(formData.demand_cost),
      eb_start_date: formData.eb_start_date,
      eb_end_date: formData.eb_end_date,
      no_of_zones: toNumberValue(formData.no_of_zones),
      no_of_phases: toNumberValue(formData.no_of_phases),
      density_volume: toNumberValue(formData.density_volume),
      extended_quantity: toNumberValue(formData.extended_quantity),
      service_charge: toNumberValue(formData.service_charge),
      transportation_cost: toNumberValue(formData.transportation_cost),
      gst: formData.gst,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code,
      bank_address: formData.bank_address,
      erection_start_date: formData.erection_start_date,
      commissioning_start_date: formData.commissioning_start_date,
      project_completion_date: formData.project_completion_date,
      weighment_folder_name: formData.weighment_folder_name,
      petty_cash: toNumberValue(formData.petty_cash),
      proposed_change: formData.proposed_change,
      remarks: formData.remarks,
    };

    const hasFiles = Object.values(fileInputs).some(Boolean);

    try {
      setLoading(true);

      if (hasFiles) {
        const formBody = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          formBody.append(key, String(value));
        });
        Object.entries(fileInputs).forEach(([key, file]) => {
          if (file) formBody.append(key, file);
        });

        if (isEdit) {
          await siteApi.update(id!, formBody);
        } else {
          await siteApi.create(formBody);
        }
      } else if (isEdit) {
        await siteApi.update(id!, payload);
      } else {
        await siteApi.create(payload);
      }

      Swal.fire("Success", "Saved successfully", "success");
      navigate(LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data ||
        "Save failed";
      Swal.fire("Error", String(message), "error");
    } finally {
      setLoading(false);
    }
  };

  /* -------- UI -------- */

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border p-5 bg-white shadow"
          >
            <h2 className="font-semibold mb-4">{section.title}</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {renderField(
                    field,
                    formData[field.name],
                    handleChange,
                    handleFileChange,
                    field.name === "state_id"
                      ? stateOptions
                      : field.name === "district_id"
                      ? districtOptions
                      : undefined
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate(LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
