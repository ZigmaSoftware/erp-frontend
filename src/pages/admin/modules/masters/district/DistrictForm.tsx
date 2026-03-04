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
import type {
  CountrySelectOption,
  DistrictRecord,
  StateSelectOption,
} from "@/types/tanstack/masters";
import {
  districtApi,
  useContinentsSelectOptions,
  useCountriesSelectOptions,
  useStatesSelectOptions,
} from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import {
  includeSelectedOption,
  isOptionActive,
  normalizeNullable,
} from "@/utils/formHelpers";

import {
  districtSchema,
  type DistrictFormValues,
} from "@/validations/masters/district.schema";

const encMasters = encryptSegment("masters");
const encDistricts = encryptSegment("districts");
const ENC_LIST_PATH = `/${encMasters}/${encDistricts}`;

function DistrictForm() {
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
  } = useForm<DistrictFormValues>({
    resolver: zodResolver(districtSchema),
    defaultValues: {
      name: "",
      continent_id: "",
      country_id: "",
      state_id: "",
      is_active: true,
    },
  });

  const [editPopulated, setEditPopulated] = useState(!isEdit);

  // -----------------------------
  // Queries
  // -----------------------------

  const continentsQuery = useContinentsSelectOptions();
  const countriesQuery = useCountriesSelectOptions();
  const statesQuery = useStatesSelectOptions();

  const continentOptions = continentsQuery.selectOptions;
  const countryOptions = countriesQuery.selectOptions;
  const stateOptions = statesQuery.selectOptions;

  // All option lists must be ready before we populate edit values
  const queriesReady =
    continentsQuery.isSuccess &&
    countriesQuery.isSuccess &&
    statesQuery.isSuccess;

  const continentId = watch("continent_id");
  const countryId = watch("country_id");
  const stateId = watch("state_id");
  const isActive = watch("is_active");

  const continentOptionsWithSelected = useMemo(() => {
    if (!continentsQuery.data) return continentOptions;
    if (!continentId) return continentOptions;
    if (continentOptions.some((option) => option.value === continentId))
      return continentOptions;
    const selected = continentsQuery.data.find(
      (item) => String(item.unique_id) === continentId
    );
    if (!selected) return continentOptions;
    return [
      ...continentOptions,
      { value: String(selected.unique_id), label: selected.name },
    ];
  }, [continentId, continentOptions, continentsQuery.data]);

  const filteredCountries = useMemo<CountrySelectOption[]>(() => {
    if (!continentId) return [];
    const activeCountries = countryOptions.filter(
      (option) => option.continentId === continentId && isOptionActive(option)
    );
    return includeSelectedOption(activeCountries, countryOptions, countryId);
  }, [continentId, countryId, countryOptions]);

  const filteredStates = useMemo<StateSelectOption[]>(() => {
    if (!countryId) return [];
    const activeStates = stateOptions.filter(
      (state) => state.countryId === countryId && isOptionActive(state)
    );
    return includeSelectedOption(activeStates, stateOptions, stateId);
  }, [countryId, stateId, stateOptions]);

  // -----------------------------
  // Detail Query (Edit Mode)
  // -----------------------------

  const detailQuery = useQuery<DistrictRecord>({
    queryKey: [...masterQueryKeys.districts, "detail", id ?? "new"],
    queryFn: () => districtApi.get(id as string),
    enabled: isEdit,
  });

  // Populate edits once we have both the record and the option lists
  useEffect(() => {
    if (!detailQuery.data || !queriesReady) return;

    const data = detailQuery.data;

    setValue("name", data.name ?? "");
    setValue("continent_id", normalizeNullable(data.continent_id));
    setValue("country_id", normalizeNullable(data.country_id));
    setValue("state_id", normalizeNullable(data.state_id));
    setValue("is_active", Boolean(data.is_active));
    setEditPopulated(true);
  }, [detailQuery.data, queriesReady, setValue]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load district",
        text: extractErrorMessage(detailQuery.error),
      });
    }
  }, [detailQuery.error]);

  // -----------------------------
  // Mutation
  // -----------------------------

  const saveMutation = useMutation({
    mutationFn: (payload: DistrictFormValues) =>
      isEdit
        ? districtApi.update(id as string, payload)
        : districtApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.districts });

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

  const onSubmit = (data: DistrictFormValues) => {
    saveMutation.mutate({
      ...data,
      name: data.name.trim(),
    });
  };

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <ComponentCard title={isEdit ? "Edit District" : "Add District"}>
      {/* Hide form until edit record + all option lists are ready */}
      {!editPopulated ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading...
        </div>
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
                  setValue("state_id", "");
                }}
                disabled={!queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Continent" />
                </SelectTrigger>
                <SelectContent>
                  {continentOptionsWithSelected.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No continents available
                    </div>
                  ) : (
                    continentOptionsWithSelected.map((opt) => (
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
                onValueChange={(val) => {
                  setValue("country_id", val);
                  setValue("state_id", "");
                }}
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

            {/* State */}
            <div>
              <Label>State *</Label>
              <Select
                value={stateId}
                onValueChange={(val) => setValue("state_id", val)}
                disabled={!countryId || !queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStates.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {countryId
                        ? "No states available"
                        : "Select a country first"}
                    </div>
                  ) : (
                    filteredStates.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.state_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.state_id.message}
                </p>
              )}
            </div>

            {/* District Name */}
            <div>
              <Label>District Name *</Label>
              <Input
                {...register("name")}
                placeholder="Enter district name"
                disabled={!queriesReady || isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
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
      )}
    </ComponentCard>
  );
}

export default DistrictForm;
