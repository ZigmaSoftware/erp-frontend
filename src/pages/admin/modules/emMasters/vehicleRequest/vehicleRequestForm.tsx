import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrashBinIcon } from "@/icons";
import { equipmentModelApi, siteApi, vehicleRequestApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { EmFormSelectOption } from "@/types/emMasters/forms";
import {
  vehicleRequestSchema,
  type VehicleRequestFormValues,
} from "@/validations/emMasters/vehicle-request.schema";
import {
  asArray,
  asRecord,
  pickFirstString,
  toStringValue,
} from "@/utils/formHelpers";

const STATUS_OPTIONS: EmFormSelectOption[] = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DEFAULT_STATUS_VALUE = STATUS_OPTIONS[0].value as VehicleRequestFormValues["request_status"];

const UNIT_OPTIONS: EmFormSelectOption[] = [
  { value: "nos", label: "nos" },
  { value: "hrs", label: "hrs" },
  { value: "days", label: "days" },
];

const vehicleRequestLookupsQueryKey = [
  ...masterQueryKeys.vehicleRequests,
  "lookups",
] as const;

const vehicleRequestDetailQueryKey = (id: string | undefined) =>
  [...masterQueryKeys.vehicleRequests, "detail", id ?? "new"] as const;

const createEmptyItem = (): VehicleRequestFormValues["items"][number] => ({
  equipment_model_id: "",
  qty: "",
  unit: "",
  purpose: "",
});

const resolveRequestStatus = (
  ...values: unknown[]
): VehicleRequestFormValues["request_status"] => {
  const candidate = pickFirstString(...values);
  const match = STATUS_OPTIONS.find((option) => option.value === candidate);
  return (match?.value ?? DEFAULT_STATUS_VALUE) as VehicleRequestFormValues["request_status"];
};

const toSelectOptions = (
  list: unknown[],
  getId: (item: Record<string, unknown>) => string,
  getLabel: (item: Record<string, unknown>) => string
): EmFormSelectOption[] =>
  list
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item): EmFormSelectOption | null => {
      const value = getId(item);
      const label = getLabel(item);
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item): item is EmFormSelectOption => Boolean(item));

const resolveModelLabel = (model: Record<string, unknown>) => {
  const name = pickFirstString(model["model_name"], model["name"]);
  if (name) return name;

  const fallback = `${pickFirstString(model["manufacturer"])} ${pickFirstString(
    model["model_name"],
    model["name"]
  )}`.trim();

  return fallback || pickFirstString(model["manufacturer"]) || "";
};

const resolveSiteLabel = (site: Record<string, unknown>) =>
  pickFirstString(site["site_name"], site["name"], site["display_name"]);

const getErrorMessage = (error: unknown, fallback: string): string => {
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord?.["response"]);
  const data = asRecord(response?.["data"]);
  const detail = pickFirstString(data?.["detail"], data?.["message"]);
  if (detail) return detail;

  if (data) {
    const fieldMessage = Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => (typeof value === "string" ? value : ""))
      .find((value) => value);
    if (fieldMessage) return fieldMessage;
  }

  return fallback;
};

const normalizeItemRow = (
  item: Record<string, unknown>
): VehicleRequestFormValues["items"][number] => {
  const modelRecord = asRecord(item["equipment_model"]);
  return {
    equipment_model_id: pickFirstString(
      item["equipment_model"],
      item["equipment_model_id"],
      item["model"],
      modelRecord?.["unique_id"],
      modelRecord?.["id"]
    ),
    qty: pickFirstString(item["qty"], item["quantity"], item["qty_requested"]),
    unit: pickFirstString(item["unit"], item["uom"]),
    purpose: pickFirstString(item["purpose"], item["remarks"]),
  };
};

export default function VehicleRequestForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { encEmMasters, encVehicleRequest } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encEmMasters}/${encVehicleRequest}`;

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<VehicleRequestFormValues>({
    resolver: zodResolver(vehicleRequestSchema),
    defaultValues: {
      description: "",
      site_id: "",
      request_status: DEFAULT_STATUS_VALUE,
      items: [createEmptyItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const lookupsQuery = useQuery({
    queryKey: vehicleRequestLookupsQueryKey,
    queryFn: async (): Promise<{
      equipmentModels: EmFormSelectOption[];
      siteOptions: EmFormSelectOption[];
    }> => {
      const [models, sites] = await Promise.all([
        equipmentModelApi.list(),
        siteApi.list(),
      ]);

      const equipmentModels = toSelectOptions(
        models,
        (item) =>
          pickFirstString(
            item["unique_id"],
            item["id"],
            item["model_id"],
            item["model"]
          ),
        (item) => resolveModelLabel(item)
      );

      const siteOptions = toSelectOptions(
        sites,
        (item) =>
          pickFirstString(item["unique_id"], item["id"], item["site_id"]),
        (item) => resolveSiteLabel(item)
      );

      return { equipmentModels, siteOptions };
    },
  });

  const detailQuery = useQuery({
    queryKey: vehicleRequestDetailQueryKey(id),
    queryFn: () => vehicleRequestApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (lookupsQuery.error) {
      Swal.fire("Error", "Unable to load lookup data", "error");
    }
  }, [lookupsQuery.error]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire("Error", "Unable to load vehicle request", "error");
    }
  }, [detailQuery.error]);

  useEffect(() => {
    if (!detailQuery.data) return;

    const payload = detailQuery.data as Record<string, unknown>;

    const rawItems =
      asArray(payload["items"]).length > 0
        ? asArray(payload["items"])
        : asArray(payload["request_items"]).length > 0
        ? asArray(payload["request_items"])
        : asArray(payload["items_data"]);

    reset({
      description: pickFirstString(payload["description"]),
      site_id: pickFirstString(
        payload["site"],
        payload["site_id"],
        asRecord(payload["site"])?.["unique_id"],
        asRecord(payload["site"])?.["id"]
      ),
      request_status: resolveRequestStatus(
        payload["request_status"],
        payload["status"]
      ),
      items:
        rawItems.length > 0
          ? rawItems.map((item) => normalizeItemRow(asRecord(item) ?? {}))
          : [createEmptyItem()],
    });
  }, [detailQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      description: string;
      site_id: string;
      request_status: VehicleRequestFormValues["request_status"];
      items: Array<{
        equipment_model_id?: string;
        qty: number;
        unit: string;
        purpose: string;
      }>;
    }) =>
      isEdit && id
        ? vehicleRequestApi.update(id, payload)
        : vehicleRequestApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.vehicleRequests,
      });
      Swal.fire({
        icon: "success",
        title: isEdit ? "Vehicle request updated" : "Vehicle request created",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate(ENC_LIST_PATH);
    },

    onError: (error: unknown) => {
      const message = getErrorMessage(error, "Unable to save vehicle request");
      Swal.fire("Error", message, "error");
    },
  });

  const submitting = saveMutation.isPending;

  const onSubmit = (values: VehicleRequestFormValues) => {
    saveMutation.mutate({
      description: values.description?.trim() ?? "",
      site_id: values.site_id,
      request_status: values.request_status,
      items: values.items.map((item) => ({
        equipment_model_id: item.equipment_model_id,
        qty: Number(item.qty),
        unit: item.unit?.trim() ?? "",
        purpose: item.purpose?.trim() ?? "",
      })),
    });
  };

  const addItem = () => {
    append(createEmptyItem());
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length <= 1) {
      const currentValues = getValues() as VehicleRequestFormValues;
      reset({
        ...currentValues,
        items: [createEmptyItem()],
      });
      return;
    }
    remove(index);
  };

  const lookups = lookupsQuery.data ?? {
    equipmentModels: [],
    siteOptions: [],
  };

  const isBusy =
    lookupsQuery.isLoading || (isEdit && detailQuery.isFetching);

  if (isBusy) {
    return (
      <div className="p-3">
        <ComponentCard
          title={isEdit ? "Edit Vehicle Request" : "New Vehicle Request"}
        >
          <p className="text-sm text-gray-500">Loading request data...</p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="p-3">
      <ComponentCard
        title={isEdit ? "Edit Vehicle Request" : "New Vehicle Request"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Site */}
            <div>
              <Label>Site *</Label>
              <Controller
                control={control}
                name="site_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.siteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.site_id && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.site_id.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Controller
                control={control}
                name="request_status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(
                        (value ??
                          STATUS_OPTIONS[0]
                            .value) as VehicleRequestFormValues["request_status"]
                      )
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.request_status && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.request_status.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Add context for this request"
              disabled={submitting}
              {...register("description")}
            />
          </div>

          {/* Items */}
          <div className="space-y-4">
            {fields.map((field, index) => {
              const equipmentError =
                errors.items?.[index]?.equipment_model_id?.message;
              const qtyError = errors.items?.[index]?.qty?.message;

              return (
                <div
                  key={field.id}
                  className="grid gap-3 border border-dashed border-gray-200 rounded-lg p-4 bg-white shadow-sm md:grid-cols-[2fr,1fr,1fr,1fr,auto]"
                >
                  {/* Equipment Model */}
                  <div>
                    <Label>
                      Equipment Model{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name={`items.${index}.equipment_model_id`}
                      render={({ field: equipmentField }) => (
                        <Select
                          value={equipmentField.value || undefined}
                          onValueChange={(value) =>
                            equipmentField.onChange(value ?? "")
                          }
                          disabled={submitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {lookups.equipmentModels.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {equipmentError && (
                      <p className="text-sm text-red-500 mt-1">
                        {equipmentError}
                      </p>
                    )}
                  </div>

                  {/* Qty */}
                  <div>
                    <Label>Qty *</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.qty`}
                      render={({ field: qtyField }) => (
                        <Input
                          type="number"
                          min={1}
                          value={qtyField.value ?? ""}
                          onChange={(e) => qtyField.onChange(e.target.value)}
                          disabled={submitting}
                        />
                      )}
                    />
                    {qtyError && (
                      <p className="text-sm text-red-500 mt-1">{qtyError}</p>
                    )}
                  </div>

                  {/* Unit */}
                  <div>
                    <Label>Unit</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.unit`}
                      render={({ field: unitField }) => (
                        <Select
                          value={unitField.value || undefined}
                          onValueChange={(value) =>
                            unitField.onChange(value ?? "")
                          }
                          disabled={submitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <Label>Purpose</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.purpose`}
                      render={({ field: purposeField }) => (
                        <Input
                          value={purposeField.value ?? ""}
                          onChange={(e) =>
                            purposeField.onChange(e.target.value)
                          }
                          disabled={submitting}
                        />
                      )}
                    />
                  </div>

                  {/* Remove */}
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      title="Remove item"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleRemoveItem(index)}
                      disabled={submitting}
                    >
                      <TrashBinIcon className="size-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {errors.items?.message && (
            <p className="text-sm text-red-500">{errors.items.message}</p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={submitting}
          >
            + Add item
          </Button>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ENC_LIST_PATH)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? "Update Request" : "Save Request"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
