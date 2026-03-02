import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { encryptSegment } from "@/utils/routeCrypto";
import { extractErrorMessage } from "@/utils/errorUtils";
import { countryApi, useContinentsSelectOptions } from "@/helpers/admin";
import type { CountryRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

import {
  countrySchema,
  type CountryFormValues,
} from "@/validations/masters/country.schema";

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encCountries = encryptSegment("countries");
const ENC_LIST_PATH = `/${encMasters}/${encCountries}`;

function CountryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const continentsQuery = useContinentsSelectOptions();
  const continentOptions = continentsQuery.selectOptions;

  /* ---------------- FORM ---------------- */

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CountryFormValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
      mob_code: "",
      currency: "",
      continent_id: "",
      is_active: true,
    },
  });

  /* ---------------- DETAIL QUERY ---------------- */

  const detailQuery = useQuery<CountryRecord>({
    queryKey: [...masterQueryKeys.countries, "detail", id],
    queryFn: () => countryApi.get(id as string),
    enabled: isEdit,
  });

  /* ---------------- POPULATE EDIT DATA ---------------- */

  useEffect(() => {
    if (!detailQuery.data) return;

    const data = detailQuery.data;

    setValue("name", data.name ?? "");
    setValue("mob_code", data.mob_code ?? "");
    setValue("currency", data.currency ?? "");
    setValue("continent_id", String(data.continent_id ?? ""));
    setValue("is_active", Boolean(data.is_active));
  }, [detailQuery.data, setValue]);

  /* ---------------- MUTATION ---------------- */

  const saveMutation = useMutation({
    mutationFn: (payload: CountryFormValues) =>
      isEdit
        ? countryApi.update(id as string, payload)
        : countryApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.countries,
      });

      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    },

    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    },
  });

  const isSubmitting = saveMutation.isPending;
  const isLoading = detailQuery.isFetching;

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = (data: CountryFormValues) => {
    saveMutation.mutate({
      ...data,
      name: data.name.trim(),
      mob_code: data.mob_code?.trim(),
      currency: data.currency?.trim(),
    });
  };

  /* ---------------- UI ---------------- */

  return (
    <ComponentCard title={isEdit ? "Edit Country" : "Add Country"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent */}
          <div>
            <Label>
              Continent Name <span className="text-red-500">*</span>
            </Label>

            <Select
              value={watch("continent_id")}
              onValueChange={(v) => setValue("continent_id", v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.continent_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.continent_id.message}
              </p>
            )}
          </div>

          {/* Country Name */}
          <div>
            <Label>
              Country Name <span className="text-red-500">*</span>
            </Label>
            <Input {...register("name")} disabled={isLoading} />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Mobile Code */}
          <div>
            <Label>Mobile Code</Label>
            <Input {...register("mob_code")} disabled={isLoading} />
          </div>

          {/* Currency */}
          <div>
            <Label>Currency</Label>
            <Input {...register("currency")} disabled={isLoading} />
          </div>

          {/* Status */}
          <div>
            <Label>
              Active Status <span className="text-red-500">*</span>
            </Label>

            <Select
              value={watch("is_active") ? "true" : "false"}
              onValueChange={(v) =>
                setValue("is_active", v === "true")
              }
              disabled={isLoading}
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
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default CountryForm;