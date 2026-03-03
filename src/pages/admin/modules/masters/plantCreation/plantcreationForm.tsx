import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import ComponentCard from "@/components/common/ComponentCard";
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

import { getEncryptedRoute } from "@/utils/routeCache";
import { plantApi } from "@/helpers/admin";
import type { PlantRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";
import { useSitesSelectOptions } from "@/tanstack/admin";
import { plantSchema, type PlantFormValues } from "@/validations/masters/plant.schema";

const { encMasters, encPlantCreation } = getEncryptedRoute();
const LIST_PATH = `/${encMasters}/${encPlantCreation}`;

const includeSelectedOption = <Option extends { value: string }>(
  base: Option[],
  options: Option[],
  selectedId: string
): Option[] => {
  if (!selectedId) return base;
  if (base.some((o) => o.value === selectedId)) return base;
  const selected = options.find((option) => option.value === selectedId);
  return selected ? [...base, selected] : base;
};

const isOptionActive = (option: { isActive?: boolean }) =>
  option.isActive !== false;

const pickSiteId = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record["unique_id"] != null) return String(record["unique_id"]);
    if (record["id"] != null) return String(record["id"]);
  }
  return "";
};

const deriveStatus = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1";

export default function PlantForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const sitesQuery = useSitesSelectOptions();
  const siteOptions = sitesQuery.selectOptions ?? [];

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      plant_name: "",
      site_id: "",
      is_active: true,
    },
  });

  const siteId = watch("site_id");

  const filteredSites = useMemo(() => {
    const activeSites = siteOptions.filter(isOptionActive);
    return includeSelectedOption(activeSites, siteOptions, siteId);
  }, [siteId, siteOptions]);

  const detailQuery = useQuery<PlantRecord>({
    queryKey: [...masterQueryKeys.plants, "detail", id ?? "new"],
    queryFn: () => plantApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const plant = detailQuery.data;

    reset({
      plant_name: plant.plant_name ?? "",
      site_id: pickSiteId(plant.site_id),
      is_active: deriveStatus(plant.is_active),
    });
  }, [detailQuery.data, reset]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire("Error", "Failed to load plant", "error");
    }
  }, [detailQuery.error]);

  const saveMutation = useMutation({
    mutationFn: (payload: PlantFormValues) =>
      isEdit ? plantApi.update(id as string, payload) : plantApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.plants });
      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully" : "Added successfully",
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
  const isLoading = isEdit && detailQuery.isFetching;

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <ComponentCard title={isEdit ? "Edit Plant" : "Add Plant"}>
      <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="plantName">
              Plant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="plantName"
              {...register("plant_name")}
              placeholder="Enter plant name"
              disabled={isSubmitting}
            />
            {errors.plant_name && (
              <p className="text-red-500 text-sm mt-1">{errors.plant_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="site">
              Site <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="site_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || sitesQuery.isFetching}
                >
                  <SelectTrigger id="site">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSites.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No sites available
                      </div>
                    ) : (
                      filteredSites.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.site_id && (
              <p className="text-red-500 text-sm mt-1">{errors.site_id.message}</p>
            )}
          </div>

          <div>
            <Label>
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? "true" : "false"}
                  onValueChange={(value) => field.onChange(value === "true")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
              ? "Update"
              : "Save"}
          </Button>
          <Button variant="destructive" type="button" onClick={() => navigate(LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
