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
  cityApi,
  useContinentsSelectOptions,
  useCountriesSelectOptions,
  useDistrictsSelectOptions,
  useStatesSelectOptions,
} from "@/helpers/admin";
import {
  includeSelectedOption,
  isOptionActive,
  normalizeNullable,
} from "@/utils/formHelpers";

import type {
  CityRecord,
  CountrySelectOption,
  DistrictSelectOption,
  StateSelectOption,
} from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

import {
  citySchema,
  type CityFormValues,
} from "@/validations/masters/city.schema";

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encCities = encryptSegment("cities");
const ENC_LIST_PATH = `/${encMasters}/${encCities}`;

/* ---------------- HELPERS ---------------- */

/* ---------------- COMPONENT ---------------- */

export default function CityForm() {
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
  } = useForm<CityFormValues>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      continent_id: "",
      country_id: "",
      state_id: "",
      district_id: "",
      is_active: true,
    },
  });

  const [editLoaded, setEditLoaded] = useState(!isEdit);

  /* ---------------- QUERIES ---------------- */

  const continentsQuery = useContinentsSelectOptions();
  const countriesQuery = useCountriesSelectOptions();
  const statesQuery = useStatesSelectOptions();
  const districtsQuery = useDistrictsSelectOptions();

  const continentOptions = continentsQuery.selectOptions ?? [];
  const countryOptions = countriesQuery.selectOptions ?? [];
  const stateOptions = statesQuery.selectOptions ?? [];
  const districtOptions = districtsQuery.selectOptions ?? [];

  const queriesReady =
    continentsQuery.isSuccess &&
    countriesQuery.isSuccess &&
    statesQuery.isSuccess &&
    districtsQuery.isSuccess;

  const continentId = watch("continent_id");
  const countryId = watch("country_id");
  const stateId = watch("state_id");
  const districtId = watch("district_id");
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

  const filteredDistricts = useMemo<DistrictSelectOption[]>(() => {
    if (!stateId) return [];
    const activeDistricts = districtOptions.filter(
      (district) => district.stateId === stateId && isOptionActive(district)
    );
    return includeSelectedOption(activeDistricts, districtOptions, districtId);
  }, [stateId, districtId, districtOptions]);

  /* ---------------- DETAIL QUERY ---------------- */

  const detailQuery = useQuery<CityRecord>({
    queryKey: [...masterQueryKeys.cities, "detail", id ?? "new"],
    queryFn: () => cityApi.get(id as string),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!detailQuery.data || !queriesReady) return;

    const data = detailQuery.data;
    setValue("name", data.name ?? "");
    setValue("continent_id", normalizeNullable(data.continent_id));
    setValue("country_id", normalizeNullable(data.country_id));
    setValue("state_id", normalizeNullable(data.state_id));
    setValue("district_id", normalizeNullable(data.district_id));
    setValue("is_active", Boolean(data.is_active));
    setEditLoaded(true);
  }, [detailQuery.data, queriesReady, setValue]);

  useEffect(() => {
    if (detailQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load city",
        text: extractErrorMessage(detailQuery.error),
      });
    }
  }, [detailQuery.error]);

  /* ---------------- MUTATION ---------------- */

  const saveMutation = useMutation({
    mutationFn: (payload: CityFormValues) =>
      isEdit
        ? cityApi.update(id as string, payload)
        : cityApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.cities });

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

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = (data: CityFormValues) => {
    saveMutation.mutate({
      ...data,
      name: data.name.trim(),
    });
  };

  /* ---------------- UI ---------------- */

  return (
    <ComponentCard title={isEdit ? "Edit City" : "Add City"}>
      {!editLoaded ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
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
                  setValue("district_id", "");
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
                  setValue("district_id", "");
                }}
                disabled={!continentId || !queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCountries.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {continentId ? "No countries available" : "Select a continent first"}
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
                onValueChange={(val) => {
                  setValue("state_id", val);
                  setValue("district_id", "");
                }}
                disabled={!countryId || !queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStates.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {countryId ? "No states available" : "Select a country first"}
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

            {/* District */}
            <div>
              <Label>District *</Label>
              <Select
                value={districtId}
                onValueChange={(val) => setValue("district_id", val)}
                disabled={!stateId || !queriesReady || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDistricts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {stateId ? "No districts available" : "Select a state first"}
                    </div>
                  ) : (
                    filteredDistricts.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.district_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.district_id.message}
                </p>
              )}
            </div>

            {/* City Name */}
            <div>
              <Label>City Name *</Label>
              <Input
                {...register("name")}
                placeholder="Enter city name"
                disabled={!queriesReady || isSubmitting}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
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

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
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
