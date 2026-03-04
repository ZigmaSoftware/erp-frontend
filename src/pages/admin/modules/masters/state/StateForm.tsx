import { useEffect, useMemo, useState } from "react";
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
import {
  stateApi,
  useContinentsSelectOptions,
  useCountriesSelectOptions,
} from "@/helpers/admin";
import type { CountrySelectOption, StateRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

import {
  stateSchema,
  type StateFormValues,
} from "@/validations/masters/state.schema";

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encStates = encryptSegment("states");
const ENC_LIST_PATH = `/${encMasters}/${encStates}`;

/* ---------------- HELPERS ---------------- */

const normalize = (value: any): string => (value ? String(value) : "");

const includeSelectedOption = <Option extends { value: string }>(
  base: Option[],
  options: Option[],
  selectedId: string
): Option[] => {
  if (!selectedId) return base;
  if (base.some((o) => o.value === selectedId)) return base;
  const selected = options.find((o) => o.value === selectedId);
  return selected ? [...base, selected] : base;
};

const isOptionActive = (option: { isActive?: boolean }) =>
  option.isActive !== false;

/* ---------------- COMPONENT ---------------- */

function StateForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StateFormValues>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      name: "",
      label: "",
      continent_id: "",
      country_id: "",
      is_active: true,
    },
  });

  const [editPopulated, setEditPopulated] = useState(!isEdit);

  // -----------------------------
  // Queries
  // -----------------------------

  const continentsQuery = useContinentsSelectOptions();
  const countriesQuery = useCountriesSelectOptions();

  const continentOptions = continentsQuery.selectOptions;
  const countryOptions = countriesQuery.selectOptions;

  const queriesReady =
    continentsQuery.isSuccess && countriesQuery.isSuccess;

  const continentId = watch("continent_id");
  const countryId = watch("country_id");
  const isActive = watch("is_active");
  const filteredCountries = useMemo<CountrySelectOption[]>(() => {
    if (!continentId) return [];
    const active = countryOptions.filter(
      (o) => o.continentId === continentId && isOptionActive(o)
    );
    return includeSelectedOption(active, countryOptions, countryId);
  }, [continentId, countryId, countryOptions]);

  // -----------------------------
  // Detail Query (Edit Mode)
  // -----------------------------

  const detailQuery = useQuery<StateRecord>({
    queryKey: [...masterQueryKeys.states, "detail", id ?? "new"],
    queryFn: () => stateApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data || !queriesReady) return;

    const data = detailQuery.data;
    setValue("name", data.name ?? "");
    setValue("label", data.label ?? "");
    setValue("continent_id", normalize(data.continent_id));
    setValue("country_id", normalize(data.country_id));
    setValue("is_active", Boolean(data.is_active));
    setEditPopulated(true);
  }, [detailQuery.data, queriesReady]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load state",
        text: extractErrorMessage(detailQuery.error),
      });
    }
  }, [detailQuery.error]);

  // -----------------------------
  // Mutation
  // -----------------------------

  const saveMutation = useMutation({
    mutationFn: (payload: StateFormValues) =>
      isEdit
        ? stateApi.update(id as string, payload)
        : stateApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.states });
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

  // -----------------------------
  // Submit
  // -----------------------------
  const onSubmit = (data: StateFormValues) => {
    saveMutation.mutate({
      ...data,
      name: data.name.trim(),
      label: data.label.trim(),
    });
  };

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <ComponentCard title={isEdit ? "Edit State" : "Add State"}>
      {!editPopulated ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Continent */}
            <div>
              <Label>Continent *</Label>
              <Select
                value={continentId}
                onValueChange={(val) => {
                  setValue("continent_id", val);
                  setValue("country_id", "");
                }}
                disabled={!queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Continent" />
                </SelectTrigger>
                <SelectContent>
                  {continentOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No continents available
                    </div>
                  ) : (
                    continentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.continent_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.continent_id.message}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <Label>Country *</Label>
              <Select
                value={countryId}
                onValueChange={(val) => setValue("country_id", val)}
                disabled={!continentId || !queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCountries.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {continentId
                        ? "No countries available"
                        : "Select a continent first"}
                    </div>
                  ) : (
                    filteredCountries.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.country_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.country_id.message}
                </p>
              )}
            </div>

            {/* State Name */}
            <div>
              <Label>State Name *</Label>
              <Input
                {...register("name")}
                placeholder="Enter state name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* State Label */}
            <div>
              <Label>State Label *</Label>
              <Input
                {...register("label")}
                placeholder="Enter state label"
                disabled={isSubmitting}
              />
              {errors.label && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.label.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label>Status *</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(val) => setValue("is_active", val === "true")}
                disabled={!queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit ? "Updating..." : "Saving..."
                : isEdit ? "Update" : "Save"}
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
      )}
    </ComponentCard>
  );
}

export default StateForm;
