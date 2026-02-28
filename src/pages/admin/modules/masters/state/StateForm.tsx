import { useEffect, useState, type FormEvent } from "react";
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
  stateApi,
  useContinentsSelectOptions,
  useCountriesNormalized,
} from "@/helpers/admin";
import type { StateRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

const encMasters = encryptSegment("masters");
const encStates = encryptSegment("states");
const ENC_LIST_PATH = `/${encMasters}/${encStates}`;

const normalizeNullableId = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
};

function StateForm() {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [continentId, setContinentId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [pendingCountryId, setPendingCountryId] = useState("");
  const [filteredCountries, setFilteredCountries] =
    useState<SelectOption<string>[]>([]);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const continentsQuery = useContinentsSelectOptions();
  const continentOptions = continentsQuery.selectOptions;

  const countriesQuery = useCountriesNormalized();
  const normalizedCountries = countriesQuery.normalized;

  const detailQueryKey = [
    ...masterQueryKeys.states,
    "detail",
    id ?? "new",
  ] as const;

  const detailQuery = useQuery<StateRecord>({
    queryKey: detailQueryKey,
    queryFn: () => stateApi.get(id as string),
    enabled: isEdit,
  });

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
    if (!detailQuery.data) return;

    setName(detailQuery.data.name ?? "");
    setLabel(detailQuery.data.label ?? "");
    setIsActive(Boolean(detailQuery.data.is_active));

    const cId = normalizeNullableId(detailQuery.data.continent_id);
    const countryIdValue = normalizeNullableId(detailQuery.data.country_id);

    setContinentId(cId ?? "");
    setCountryId(countryIdValue ?? "");
    setPendingCountryId(countryIdValue ?? "");
  }, [detailQuery.data]);

  useEffect(() => {
    if (continentsQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to fetch continents",
        text: extractErrorMessage(continentsQuery.error),
      });
    }
  }, [continentsQuery.error]);

  useEffect(() => {
    if (countriesQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to fetch countries",
        text: extractErrorMessage(countriesQuery.error),
      });
    }
  }, [countriesQuery.error]);

  useEffect(() => {
    if (!continentId) {
      setFilteredCountries([]);
      if (!pendingCountryId) {
        setCountryId("");
      }
      return;
    }

    const filtered = normalizedCountries
      .filter(
        (country) => country.isActive && country.continentId === continentId
      )
      .map<SelectOption<string>>((country) => ({
        value: country.id,
        label: country.name,
      }));

    const withSelected = [...filtered];
    if (countryId && !withSelected.some((option) => option.value === countryId)) {
      const selected = normalizedCountries.find((country) => country.id === countryId);
      if (selected) {
        withSelected.push({ value: selected.id, label: selected.name });
      }
    }

    setFilteredCountries(withSelected);
    setCountryId((prev) => {
      if (pendingCountryId) {
        return prev;
      }
      return filtered.some((option) => option.value === prev) ? prev : "";
    });
  }, [continentId, normalizedCountries, pendingCountryId]);

  useEffect(() => {
    if (!pendingCountryId) return;
    if (filteredCountries.length === 0) return;

    const exists = filteredCountries.some(
      (country) => country.value === pendingCountryId
    );

    if (exists) {
      setCountryId(pendingCountryId);
      setPendingCountryId("");
    }
  }, [filteredCountries, pendingCountryId]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      label: string;
      continent_id: string;
      country_id: string;
      is_active: boolean;
    }) =>
      isEdit
        ? stateApi.update(id as string, payload)
        : stateApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.states,
      });
      Swal.fire({
        icon: "success",
        title: isEdit ? "State updated successfully!" : "State created successfully!",
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
  const isDetailLoading = detailQuery.isFetching;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !continentId ||
      !countryId ||
      !name.trim() ||
      !label.trim()
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please fill all required fields.",
      });
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      label: label.trim(),
      continent_id: continentId,
      country_id: countryId,
      is_active: isActive,
    });
  };

  return (
    <ComponentCard title={isEdit ? "Edit State" : "Add State"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="continent">
              Continent Name <span className="text-red-500">*</span>
            </Label>
            <Select
              value={continentId || undefined}
              onValueChange={(value) => {
                setContinentId(value);
                setCountryId("");
                setPendingCountryId("");
              }}
              disabled={isDetailLoading}
            >
              <SelectTrigger className="input-validate w-full" id="continent">
                <SelectValue placeholder="Select continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {continentsQuery.isLoading
                      ? "Loading continents..."
                      : "No continents available"}
                  </div>
                ) : (
                  continentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="country">
              Country Name <span className="text-red-500">*</span>
            </Label>
            <Select
              value={countryId || undefined}
              onValueChange={(value) => setCountryId(value)}
              disabled={!continentId || isDetailLoading}
            >
              <SelectTrigger className="input-validate w-full" id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {continentId
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

          <div>
            <Label htmlFor="stateName">
              State Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stateName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter state name"
              className="input-validate w-full"
              required
              disabled={isDetailLoading}
            />
          </div>

          <div>
            <Label htmlFor="stateLabel">
              State Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stateLabel"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter state label"
              className="input-validate w-full"
              required
              disabled={isDetailLoading}
            />
          </div>

          <div>
            <Label htmlFor="isActive">
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(value) => setIsActive(value === "true")}
              disabled={isDetailLoading}
            >
              <SelectTrigger className="input-validate w-full" id="isActive">
                <SelectValue placeholder="Select status" />
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
            {isSubmitting ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
          </Button>
          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default StateForm;
