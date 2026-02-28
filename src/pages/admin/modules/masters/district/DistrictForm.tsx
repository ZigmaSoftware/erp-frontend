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
import type { SelectOption } from "@/types/forms";
import {
  districtApi,
  useContinentsSelectOptions,
  useCountriesNormalized,
  useStatesQuery,
} from "@/helpers/admin";
import type { DistrictRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

const encMasters = encryptSegment("masters");
const encDistricts = encryptSegment("districts");
const ENC_LIST_PATH = `/${encMasters}/${encDistricts}`;

const normalize = (value: any): string => (value ? String(value) : "");

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
  const countriesQuery = useCountriesNormalized();
  const statesQuery = useStatesQuery();

  const continentOptions = continentsQuery.selectOptions;

  const filteredCountries = useMemo<SelectOption<string>[]>(() => {
    if (!continentId) return [];
    const base = countriesQuery.normalized
      .filter((c) => c.isActive && c.continentId === continentId)
      .map((c) => ({ value: c.id, label: c.name }));

    if (countryId && !base.some((option) => option.value === countryId)) {
      const selected = countriesQuery.normalized.find(
        (c) => c.id === countryId
      );
      if (selected) {
        base.push({ value: selected.id, label: selected.name });
      }
    }

    return base;
  }, [continentId, countryId, countriesQuery.normalized]);

  const filteredStates = useMemo<SelectOption<string>[]>(() => {
    if (!countryId) return [];
    const base = (statesQuery.data ?? [])
      .filter((s) => s.is_active && normalize(s.country_id) === countryId)
      .map((s) => ({
        value: normalize(s.unique_id),
        label: s.name,
      }));

    if (stateId && !base.some((option) => option.value === stateId)) {
      const selected = (statesQuery.data ?? []).find(
        (state) => normalize(state.unique_id) === stateId
      );
      if (selected) {
        base.push({
          value: normalize(selected.unique_id),
          label: selected.name,
        });
      }
    }

    return base;
  }, [countryId, stateId, statesQuery.data]);

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

    setDistrictName(detailQuery.data.name ?? "");
    setContinentId(normalize(detailQuery.data.continent_id));
    setCountryId(normalize(detailQuery.data.country_id));
    setStateId(normalize(detailQuery.data.state_id));
    setIsActive(Boolean(detailQuery.data.is_active));
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
                {continentOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
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
                {filteredCountries.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
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
                {filteredStates.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
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
