import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

type FieldConfig = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  as?: "textarea" | "select";
  options?: string[];
  step?: string;
};

type SectionConfig = {
  title: string;
  description?: string;
  fields: FieldConfig[];
};

type FormValues = Record<string, string>;

type FileValues = Record<string, File | null>;

const fileFieldNames = new Set(["verification_document", "document_view"]);

const sections: SectionConfig[] = [
  {
    title: "Core Site & Location",
    fields: [
      { label: "Site Name", name: "site_name", placeholder: "Enter site name" },
      { label: "State", name: "state", placeholder: "Enter state" },
      { label: "District", name: "district", placeholder: "Enter district" },
      { label: "ULB", name: "ulb", placeholder: "Enter ULB" },
      {
        label: "Status",
        name: "status",
        as: "select",
        options: ["Active", "Inactive"],
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

const buildInitialFormData = () =>
  sections.reduce<FormValues>((acc, section) => {
    section.fields.forEach((field) => {
      if (fileFieldNames.has(field.name)) {
        acc[field.name] = "";
        return;
      }

      if (field.as === "select") {
        acc[field.name] = "";
        return;
      }

      acc[field.name] = "";
    });
    return acc;
  }, {});

const buildInitialFileValues = () =>
  Array.from(fileFieldNames).reduce<FileValues>((acc, key) => {
    acc[key] = null;
    return acc;
  }, {});

const renderField = (
  field: FieldConfig,
  value: string,
  onChange: (name: string, value: string) => void,
  onFileChange: (name: string, file: File | null) => void
) => {
  if (field.as === "textarea") {
    return (
      <Textarea
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    );
  }

  if (field.as === "select") {
    return (
      <Select
        value={value === "" ? undefined : value}
        onValueChange={(nextValue) => onChange(field.name, nextValue)}
      >
        <SelectTrigger id={field.name}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
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
        name={field.name}
        type="file"
        onChange={(event) =>
          onFileChange(field.name, event.target.files?.[0] ?? null)
        }
      />
    );
  }

  return (
    <Input
      id={field.name}
      name={field.name}
      type={field.type ?? "text"}
      placeholder={field.placeholder}
      step={field.step}
      value={value}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
};

export default function SiteCreationForm() {
  const [formData, setFormData] = useState<FormValues>(() =>
    buildInitialFormData()
  );
  const [fileInputs, setFileInputs] = useState<FileValues>(() =>
    buildInitialFileValues()
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const numericFields = useMemo(() => {
    const names = new Set<string>();
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === "number") {
          names.add(field.name);
        }
      });
    });
    return names;
  }, []);

  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { encMasters, encSiteCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encMasters}/${encSiteCreation}`;

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchSite = async () => {
      try {
        setFetching(true);
        const site = await siteApi.get(id);

        setFormData((prev) => {
          const next = { ...prev };
          Object.keys(prev).forEach((key) => {
            if (fileFieldNames.has(key)) return;

            if (key === "status") {
              if (typeof site?.status === "string") {
                next.status = site.status;
                return;
              }

              if (typeof site?.is_active === "boolean") {
                next.status = site.is_active ? "Active" : "Inactive";
                return;
              }
            }

            const value = site?.[key];
            next[key] = value === null || value === undefined ? "" : String(value);
          });

          return next;
        });
      } catch (error) {
        console.error("Failed to load site", error);
        Swal.fire("Error", "Site not found", "error");
        navigate(ENC_LIST_PATH);
      } finally {
        setFetching(false);
      }
    };

    fetchSite();
  }, [ENC_LIST_PATH, id, isEdit, navigate]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFileInputs((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = Object.entries(formData).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (fileFieldNames.has(key)) {
          return acc;
        }

        if (numericFields.has(key)) {
          if (value === "") {
            acc[key] = "";
            return acc;
          }

          const parsed = Number(value);
          acc[key] = Number.isNaN(parsed) ? value : parsed;
          return acc;
        }

        acc[key] = value;
        return acc;
      },
      {}
    );

    const hasFiles = Object.values(fileInputs).some((file) => file);

    try {
      setLoading(true);

      if (hasFiles) {
        const formBody = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          formBody.append(key, String(value));
        });

        Object.entries(fileInputs).forEach(([key, file]) => {
          if (file) {
            formBody.append(key, file);
          }
        });

        const multipartConfig = {
          headers: { "Content-Type": "multipart/form-data" },
        };

        if (isEdit && id) {
          await siteApi.update(id, formBody, multipartConfig);
          Swal.fire({
            icon: "success",
            title: "Updated successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await siteApi.create(formBody, multipartConfig);
          Swal.fire({
            icon: "success",
            title: "Added successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } else if (isEdit && id) {
        await siteApi.update(id, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await siteApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error) {
      console.error("Save failed", error);
      Swal.fire("Error", "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* <h1 className="text-2xl font-semibold text-gray-800">
            Master / Site Creation
          </h1> */}
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {/* {isEdit ? "Edit Mode" : "Add Mode"} */}
            {isEdit ? "Edit Site" : "Add Site"}
          </span>
        </div>
        {/* <p className="text-sm text-gray-500">
          {isEdit
            ? "Update site, commercial, and operational details."
            : "Fill in site, commercial, and operational details."}
        </p> */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {section.title}
              </h2>
              {section.description ? (
                <p className="text-sm text-gray-500">{section.description}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label
                    htmlFor={field.name}
                    className="text-xs font-semibold text-gray-700"
                  >
                    {field.label}
                  </Label>
                  {renderField(
                    field,
                    formData[field.name] ?? "",
                    handleChange,
                    handleFileChange
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading || fetching}>
            {loading ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ENC_LIST_PATH)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
