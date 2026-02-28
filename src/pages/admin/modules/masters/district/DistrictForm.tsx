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

const encMasters = encryptSegment("masters");
const encDistricts = encryptSegment("districts");
const ENC_LIST_PATH = `/${encMasters}/${encDistricts}`;

const normalize = (value: any): string => (value ? String(value) : "");

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

function DistrictForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  // 🔥 Always controlled (never undefined)
  const [districtName, setDistrictName] = useState("");
  const [continentId, setContinentId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // -----------------------------
  // Queries
  // -----------------------------

  const continentsQuery = useContinentsSelectOptions();
  const countriesQuery = useCountriesSelectOptions();
  const statesQuery = useStatesSelectOptions();

  const continentOptions = continentsQuery.selectOptions;
  const countryOptions = countriesQuery.selectOptions;
  const stateOptions = statesQuery.selectOptions;

  const continentOptionsWithSelected = useMemo(() => {
    if (!continentsQuery.data) return continentOptions;
    if (!continentId) return continentOptions;
    if (continentOptions.some((option) => option.value === continentId)) {
      return continentOptions;
    }
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

    return includeSelectedOption(
      activeCountries,
      countryOptions,
      countryId
    );
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

  useEffect(() => {
    if (!detailQuery.data) return;
    const data = detailQuery.data;

    setDistrictName(data.name ?? "");
    setContinentId(normalize(data.continent_id));
    setCountryId(normalize(data.country_id));
    setStateId(normalize(data.state_id));
    setIsActive(Boolean(data.is_active));
  }, [detailQuery.data]);

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
    mutationFn: (payload: {
      name: string;
      continent_id: string;
      country_id: string;
      state_id: string;
      is_active: boolean;
    }) =>
      isEdit
        ? districtApi.update(id as string, payload)
        : districtApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.districts,
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

  // -----------------------------
  // Submit
  // -----------------------------

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!continentId || !countryId || !stateId || !districtName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "All fields are mandatory.",
      });
      return;
    }

    saveMutation.mutate({
      name: districtName.trim(),
      continent_id: continentId,
      country_id: countryId,
      state_id: stateId,
      is_active: isActive,
    });
  };

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <ComponentCard title={isEdit ? "Edit District" : "Add District"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent */}
          <div>
            <Label>Continent *</Label>
            <Select
              value={continentId}
              onValueChange={(val) => {
                setContinentId(val);
                setCountryId("");
                setStateId("");
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptionsWithSelected.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {continentsQuery.isLoading
                      ? "Loading continents..."
                      : "No continents available"}
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
          </div>

          {/* Country */}
          <div>
            <Label>Country *</Label>
            <Select
              value={countryId}
              onValueChange={(val) => {
                setCountryId(val);
                setStateId("");
              }}
              disabled={!continentId || isLoading}
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
          </div>

          {/* State */}
          <div>
            <Label>State *</Label>
            <Select
              value={stateId}
              onValueChange={(val) => setStateId(val)}
              disabled={!countryId || isLoading}
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
          </div>

          {/* District Name */}
          <div>
            <Label>District Name *</Label>
            <Input
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder="Enter district name"
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status *</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
              disabled={isLoading}
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
    </ComponentCard>
  );
}

export default DistrictForm;
