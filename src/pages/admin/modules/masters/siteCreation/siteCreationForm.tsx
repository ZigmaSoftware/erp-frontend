import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  useDistrictsSelectOptions,
  useStatesSelectOptions,
} from "@/tanstack/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import {
  includeSelectedOption,
  isOptionActive,
  normalizeStatusLabel,
  resolveOptionValue,
  toNumberValue,
} from "@/utils/formHelpers";
import { masterQueryKeys, type SiteRecord } from "@/types/tanstack/masters";
import type {
  SiteFileFieldName,
  SiteFileValues,
  SiteFormFieldConfig,
  SiteFormSectionConfig,
  SiteMutationVariables,
} from "@/types/masters/forms";
import { SITE_FILE_FIELD_NAMES } from "@/types/masters/forms";
import { siteSchema, type SiteFormValues } from "@/validations/masters/site.schema";

const { encMasters, encSiteCreation } = getEncryptedRoute();
const LIST_PATH = `/${encMasters}/${encSiteCreation}`;

const toFormString = (value: string | number | null | undefined): string =>
  value == null ? "" : String(value);

const buildInitialFileValues = (): SiteFileValues =>
  SITE_FILE_FIELD_NAMES.reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {} as SiteFileValues);

const sections: SiteFormSectionConfig[] = [
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

/* ---------------- COMPONENT ---------------- */

export default function SiteCreationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      site_name: "",
      state_id: "",
      district_id: "",
      ulb: "",
      status: "",
      site_address: "",
      latitude: "",
      longitude: "",
      project_value: "",
      project_type_details: "",
      basic_payment_per_m3: "",
      dc_invoice_no: "",
      min_max_type: "",
      screen_name: "",
      weighbridge_count: "",
      eb_rate: "",
      unit_per_cost: "",
      kwh: "",
      demand_cost: "",
      eb_start_date: "",
      eb_end_date: "",
      no_of_zones: "",
      no_of_phases: "",
      density_volume: "",
      extended_quantity: "",
      service_charge: "",
      transportation_cost: "",
      gst: "",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      bank_address: "",
      erection_start_date: "",
      commissioning_start_date: "",
      project_completion_date: "",
      weighment_folder_name: "",
      petty_cash: "",
      proposed_change: "",
      remarks: "",
    },
  });

  const [fileInputs, setFileInputs] = useState<SiteFileValues>(buildInitialFileValues);

  const statesQuery = useStatesSelectOptions();
  const districtsQuery = useDistrictsSelectOptions();

  const stateOptions = statesQuery.selectOptions ?? [];
  const districtOptions = districtsQuery.selectOptions ?? [];

  const queriesReady = statesQuery.isSuccess && districtsQuery.isSuccess;
  const stateId = watch("state_id");
  const districtId = watch("district_id");

  const filteredStates = useMemo(() => {
    const activeStates = stateOptions.filter(isOptionActive);
    return includeSelectedOption(activeStates, stateOptions, stateId);
  }, [stateId, stateOptions]);

  const filteredDistricts = useMemo(() => {
    if (!stateId) return [];
    const activeDistricts = districtOptions.filter(
      (option) => option.stateId === stateId && isOptionActive(option)
    );
    return includeSelectedOption(activeDistricts, districtOptions, districtId);
  }, [stateId, districtId, districtOptions]);

  const detailQuery = useQuery<SiteRecord>({
    queryKey: [...masterQueryKeys.sites, "detail", id ?? "new"],
    queryFn: () => siteApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data || !queriesReady) return;

    const site = detailQuery.data;
    reset({
      site_name: site.site_name ?? "",
      state_id: resolveOptionValue(site.state_id, stateOptions),
      district_id: resolveOptionValue(site.district_id, districtOptions),
      ulb: site.ulb ?? "",
      status: normalizeStatusLabel(site.status),
      site_address: site.site_address ?? "",
      latitude: toFormString(site.latitude),
      longitude: toFormString(site.longitude),
      project_value: toFormString(site.project_value),
      project_type_details: site.project_type_details ?? "",
      basic_payment_per_m3: toFormString(site.basic_payment_per_m3),
      dc_invoice_no: site.dc_invoice_no ?? "",
      min_max_type: site.min_max_type ?? "",
      screen_name: site.screen_name ?? "",
      weighbridge_count: toFormString(site.weighbridge_count),
      eb_rate: toFormString(site.eb_rate),
      unit_per_cost: toFormString(site.unit_per_cost),
      kwh: toFormString(site.kwh),
      demand_cost: toFormString(site.demand_cost),
      eb_start_date: site.eb_start_date ?? "",
      eb_end_date: site.eb_end_date ?? "",
      no_of_zones: toFormString(site.no_of_zones),
      no_of_phases: toFormString(site.no_of_phases),
      density_volume: toFormString(site.density_volume),
      extended_quantity: toFormString(site.extended_quantity),
      service_charge: toFormString(site.service_charge),
      transportation_cost: toFormString(site.transportation_cost),
      gst: site.gst ?? "",
      bank_name: site.bank_name ?? "",
      account_number: site.account_number ?? "",
      ifsc_code: site.ifsc_code ?? "",
      bank_address: site.bank_address ?? "",
      erection_start_date: site.erection_start_date ?? "",
      commissioning_start_date: site.commissioning_start_date ?? "",
      project_completion_date: site.project_completion_date ?? "",
      weighment_folder_name: site.weighment_folder_name ?? "",
      petty_cash: toFormString(site.petty_cash),
      proposed_change: site.proposed_change ?? "",
      remarks: site.remarks ?? "",
    });

    setFileInputs(buildInitialFileValues());
  }, [detailQuery.data, districtOptions, queriesReady, reset, stateOptions]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load site",
        text: "Something went wrong",
      });
    }
  }, [detailQuery.error]);

  const saveMutation = useMutation({
    mutationFn: ({ payload, formData }: SiteMutationVariables) =>
      isEdit
        ? siteApi.update(id as string, formData ?? payload)
        : siteApi.create(formData ?? payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.sites });
      Swal.fire({
        icon: "success",
        title: "Saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate(LIST_PATH);
    },
    onError: () => {
      Swal.fire("Error", "Save failed", "error");
    },
  });

  const isSubmitting = saveMutation.isPending;
  const showLoader = isEdit && (!detailQuery.data || !queriesReady);

  const handleFileChange = (name: SiteFileFieldName, file: File | null) =>
    setFileInputs((prev) => ({ ...prev, [name]: file }));

  const buildFormBody = (payload: Record<string, unknown>) => {
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
    return formBody;
  };

  const onSubmit = (values: SiteFormValues) => {
    const payload: Record<string, unknown> = {
      ...values,
      is_active: values.status ? values.status === "Active" : undefined,
      latitude: toNumberValue(values.latitude),
      longitude: toNumberValue(values.longitude),
      project_value: toNumberValue(values.project_value),
      basic_payment_per_m3: toNumberValue(values.basic_payment_per_m3),
      weighbridge_count: toNumberValue(values.weighbridge_count),
      eb_rate: toNumberValue(values.eb_rate),
      unit_per_cost: toNumberValue(values.unit_per_cost),
      kwh: toNumberValue(values.kwh),
      demand_cost: toNumberValue(values.demand_cost),
      no_of_zones: toNumberValue(values.no_of_zones),
      no_of_phases: toNumberValue(values.no_of_phases),
      density_volume: toNumberValue(values.density_volume),
      extended_quantity: toNumberValue(values.extended_quantity),
      service_charge: toNumberValue(values.service_charge),
      transportation_cost: toNumberValue(values.transportation_cost),
      petty_cash: toNumberValue(values.petty_cash),
    };

    const willSubmitWithFiles = Object.values(fileInputs).some(Boolean);
    saveMutation.mutate({
      payload,
      formData: willSubmitWithFiles ? buildFormBody(payload) : undefined,
    });
  };

  const renderField = (field: SiteFormFieldConfig) => {
    if (field.type === "file") {
      const fieldName = field.name as SiteFileFieldName;
      return (
        <>
          <Input
            id={field.name}
            type="file"
            onChange={(event) =>
              handleFileChange(fieldName, event.target.files?.[0] ?? null)
            }
          />
          {fileInputs[fieldName] && (
            <p className="text-xs text-muted-foreground">
              Selected: {fileInputs[fieldName]?.name}
            </p>
          )}
        </>
      );
    }

    const fieldName = field.name as keyof SiteFormValues;
    const error = errors[fieldName]?.message as string | undefined;

    if (field.as === "textarea") {
      return (
        <>
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            {...register(fieldName)}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </>
      );
    }

    if (field.as === "select") {
      const isStateField = field.name === "state_id";
      const isDistrictField = field.name === "district_id";
      const options = isStateField
        ? filteredStates
        : isDistrictField
        ? filteredDistricts
        : field.options ?? [];
      const disabled =
        isSubmitting ||
        (isStateField ? statesQuery.isFetching : false) ||
        (isDistrictField ? (!stateId || districtsQuery.isFetching) : false);

      return (
        <>
          <Controller
            name={fieldName}
            control={control}
            render={({ field: controllerField }) => (
              <Select
                value={controllerField.value ?? ""}
                onValueChange={(value) => {
                  controllerField.onChange(value);
                  if (isStateField) {
                    setValue("district_id", "");
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {isStateField
                        ? "No states available"
                        : isDistrictField
                        ? stateId
                          ? "No districts available"
                          : "Select a state first"
                        : "No options available"}
                    </div>
                  ) : (
                    options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </>
      );
    }

    return (
      <>
        <Input
          id={field.name}
          {...register(fieldName)}
          type={field.type ?? "text"}
          step={field.step}
          placeholder={field.placeholder}
          disabled={isSubmitting}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </>
    );
  };

  if (showLoader) {
    return (
      <div className="py-10 text-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {renderField(field)}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
          </Button>
          <Button variant="outline" type="button" onClick={() => navigate(LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
