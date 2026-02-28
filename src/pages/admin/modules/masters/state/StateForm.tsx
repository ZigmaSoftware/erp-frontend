import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import type {
  CountrySelectOption,
  StateRecord,
} from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encStates = encryptSegment("states");
const ENC_LIST_PATH = `/${encMasters}/${encStates}`;

/* ---------------- TYPES ---------------- */

type StateFormValues = {
  name: string;
  label: string;
  continent_id: string;
  country_id: string;
  is_active: string; // string for Select
};

const buildInitialFormData = (): StateFormValues => ({
  name: "",
  label: "",
  continent_id: "",
  country_id: "",
  is_active: "true",
});

const includeSelectedOption = <Option extends { value: string }>(
  base: Option[],
  options: Option[],
  selectedId: string
): Option[] => {
  if (!selectedId) return base;
  if (base.some((option) => option.value === selectedId)) {
    return base;
  }
  const selected = options.find((option) => option.value === selectedId);
  return selected ? [...base, selected] : base;
};

const isOptionActive = (option: { isActive?: boolean }) =>
  option.isActive !== false;

/* ---------------- COMPONENT ---------------- */

function StateForm() {
  const [formData, setFormData] =
    useState<StateFormValues>(buildInitialFormData);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  /* ---------------- CONTINENTS ---------------- */

  const continentsQuery = useContinentsSelectOptions();
  const continentOptions = continentsQuery.selectOptions;

  const continentOptionsWithSelected = useMemo(() => {
    if (!formData.continent_id) return continentOptions;
    if (continentOptions.some((option) => option.value === formData.continent_id)) {
      return continentOptions;
    }

    const selected = continentsQuery.data?.find(
      (item) => String(item.unique_id) === formData.continent_id
    );

    if (!selected) return continentOptions;
    return [
      ...continentOptions,
      { value: String(selected.unique_id), label: selected.name },
    ];
  }, [formData.continent_id, continentOptions, continentsQuery.data]);

  /* ---------------- COUNTRIES ---------------- */

  const countriesQuery = useCountriesSelectOptions();
  const countryOptions = countriesQuery.selectOptions;

  const filteredCountries = useMemo<CountrySelectOption[]>(() => {
    if (!formData.continent_id) return [];

    const active = countryOptions.filter(
      (country) =>
        country.continentId === formData.continent_id &&
        isOptionActive(country)
    );

    return includeSelectedOption(active, countryOptions, formData.country_id);
  }, [countryOptions, formData.continent_id, formData.country_id]);

  /* ---------------- DETAIL QUERY ---------------- */

  const detailQuery = useQuery<StateRecord>({
    queryKey: [...masterQueryKeys.states, "detail", id],
    queryFn: () => stateApi.get(id as string),
    enabled: isEdit,
    refetchOnMount: "always",
  });

  /* ---------------- POPULATE EDIT DATA ---------------- */

  useEffect(() => {
    if (!detailQuery.data) return;

    const data = detailQuery.data;

    setFormData({
      name: data.name ?? "",
      label: data.label ?? "",
      continent_id: String(data.continent_id ?? ""),
      country_id: String(data.country_id ?? ""),
      is_active: data.is_active ? "true" : "false",
    });
  }, [detailQuery.data]);

  /* ---------------- ERROR HANDLING ---------------- */

  useEffect(() => {
    if (detailQuery.isError) {
      Swal.fire({
        icon: "error",
        title: "Failed to load state",
        text: extractErrorMessage(detailQuery.error),
      });
    }
  }, [detailQuery.isError, detailQuery.error]);

  useEffect(() => {
    if (continentsQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load continents",
        text: extractErrorMessage(continentsQuery.error),
      });
    }
  }, [continentsQuery.error]);

  useEffect(() => {
    if (countriesQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load countries",
        text: extractErrorMessage(countriesQuery.error),
      });
    }
  }, [countriesQuery.error]);

  /* ---------------- MUTATION ---------------- */

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? stateApi.update(id as string, payload)
        : stateApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.states,
      });

      Swal.fire({
        icon: "success",
        title: isEdit
          ? "State updated successfully!"
          : "State created successfully!",
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

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (
    name: keyof StateFormValues,
    value: string
  ) => {
    setFormData((prev) => {
      // Reset country if continent changes
      if (name === "continent_id") {
        return { ...prev, continent_id: value, country_id: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.label.trim() ||
      !formData.continent_id ||
      !formData.country_id
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill all required fields.",
      });
      return;
    }

    saveMutation.mutate({
      name: formData.name.trim(),
      label: formData.label.trim(),
      continent_id: formData.continent_id,
      country_id: formData.country_id,
      is_active: formData.is_active === "true",
    });
  };

  const isSubmitting = saveMutation.isPending;
  const isLoading = detailQuery.isFetching;

  /* ---------------- UI ---------------- */

  return (
    <ComponentCard title={isEdit ? "Edit State" : "Add State"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent */}
          <div>
            <Label>Continent Name *</Label>
            <Select
              value={formData.continent_id || undefined}
              onValueChange={(v) => handleChange("continent_id", v)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptionsWithSelected.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {continentsQuery.isFetching
                      ? "Loading continents..."
                      : "No continents available"}
                  </div>
                ) : (
                  continentOptionsWithSelected.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div>
            <Label>Country Name *</Label>
            <Select
              value={formData.country_id || undefined}
              onValueChange={(v) => handleChange("country_id", v)}
              disabled={!formData.continent_id || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {formData.continent_id
                      ? "No countries available"
                      : "Select a continent first"}
                  </div>
                ) : (
                  filteredCountries.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* State Name */}
          <div>
            <Label>State Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                handleChange("name", e.target.value)
              }
              disabled={isLoading}
            />
          </div>

          {/* State Label */}
          <div>
            <Label>State Label *</Label>
            <Input
              value={formData.label}
              onChange={(e) =>
                handleChange("label", e.target.value)
              }
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <Label>Active Status *</Label>
            <Select
              value={formData.is_active}
              onValueChange={(v) =>
                handleChange("is_active", v)
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

export default StateForm;
