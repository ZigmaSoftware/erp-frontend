import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

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
import type {
  CityRecord,
  CountrySelectOption,
  DistrictSelectOption,
  StateSelectOption,
} from "@/types/tanstack/masters";

const normalizeNullable = (v: any): string | null => {
  if (v === undefined || v === null) return null;
  return String(v);
};

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

/* ------------------------------
    ROUTES
------------------------------ */
const encMasters = encryptSegment("masters");
const encCities = encryptSegment("cities");
const ENC_LIST_PATH = `/${encMasters}/${encCities}`;


/* ==========================================================
    COMPONENT STARTS
========================================================== */
export default function CityForm() {
  const [cityName, setCityName] = useState("");
  const [continentId, setContinentId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const continentsQuery = useContinentsSelectOptions();
  const countriesQuery = useCountriesSelectOptions();
  const statesQuery = useStatesSelectOptions();
  const districtsQuery = useDistrictsSelectOptions();

  const continentOptions = continentsQuery.selectOptions;
  const countryOptions = countriesQuery.selectOptions;
  const stateOptions = statesQuery.selectOptions;
  const districtOptions = districtsQuery.selectOptions;

  const continentOptionsWithSelected = useMemo(() => {
    if (!continentsQuery.data) return continentOptions;
    if (!continentId) return continentOptions;
    if (continentOptions.some((option) => option.value === continentId)) {
      return continentOptions;
    }
    const selected = continentsQuery.data.find(
      (option) => String(option.unique_id) === continentId
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
      (option) => option.countryId === countryId && isOptionActive(option)
    );
    return includeSelectedOption(activeStates, stateOptions, stateId);
  }, [countryId, stateId, stateOptions]);

  const filteredDistricts = useMemo<DistrictSelectOption[]>(() => {
    if (!stateId) return [];
    const activeDistricts = districtOptions.filter(
      (option) => option.stateId === stateId && isOptionActive(option)
    );
    return includeSelectedOption(activeDistricts, districtOptions, districtId);
  }, [stateId, districtId, districtOptions]);

  useEffect(() => {
    if (continentsQuery.error) {
      Swal.fire("Error", extractErrorMessage(continentsQuery.error), "error");
    }
  }, [continentsQuery.error]);

  useEffect(() => {
    if (countriesQuery.error) {
      Swal.fire("Error", extractErrorMessage(countriesQuery.error), "error");
    }
  }, [countriesQuery.error]);

  useEffect(() => {
    if (statesQuery.error) {
      Swal.fire("Error", extractErrorMessage(statesQuery.error), "error");
    }
  }, [statesQuery.error]);

  useEffect(() => {
    if (districtsQuery.error) {
      Swal.fire("Error", extractErrorMessage(districtsQuery.error), "error");
    }
  }, [districtsQuery.error]);

  useEffect(() => {
    if (!isEdit || !id) return;

    let isMounted = true;

    (async () => {
      try {
        const data: CityRecord = await cityApi.get(id);

        if (!isMounted) return;

        setCityName(data.name ?? "");
        setIsActive(Boolean(data.is_active));

        const cont = normalizeNullable(data.continent_id ?? data.continent);
        const ctr = normalizeNullable(data.country_id ?? data.country);
        const ste = normalizeNullable(data.state_id ?? data.state);
        const dis = normalizeNullable(data.district_id ?? data.district);

        setContinentId(cont ?? "");
        setCountryId(ctr ?? "");
        setStateId(ste ?? "");
        setDistrictId(dis ?? "");
      } catch (err) {
        if (isMounted) {
          Swal.fire("Error", extractErrorMessage(err), "error");
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  /* ==========================================================
      SUBMIT
  ========================================================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!continentId || !countryId || !stateId || !districtId || !cityName.trim()) {
      Swal.fire("Missing Fields", "All fields are mandatory.", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: cityName.trim(),
        continent_id: continentId,
        country_id: countryId,
        state_id: stateId,
        district_id: districtId,
        is_active: isActive,
      };

      if (isEdit && id) {
        await cityApi.update(id, payload);
        Swal.fire("Success", "Updated successfully!", "success");
      } else {
        await cityApi.create(payload);
        Swal.fire("Success", "Added successfully!", "success");
      }

      navigate(ENC_LIST_PATH);
    } catch (err) {
      Swal.fire("Save failed", extractErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
      JSX
  ========================================================== */
  return (
    <ComponentCard title={isEdit ? "Edit City" : "Add City"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent */}
          <div>
            <Label>Continent *</Label>
            <Select
              value={continentId || undefined}
              onValueChange={(val) => {
                setContinentId(val);
                setCountryId("");
                setStateId("");
                setDistrictId("");
              }}
              disabled={loading || continentsQuery.isFetching}
            >
              <SelectTrigger className="input-validate w-full">
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
            <Label>Country *</Label>
            <Select
              value={countryId || undefined}
              onValueChange={(val) => {
                setCountryId(val);
                setStateId("");
                setDistrictId("");
              }}
              disabled={!continentId || loading || countriesQuery.isFetching}
            >
              <SelectTrigger className="input-validate w-full">
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
          </div>

          {/* State */}
          <div>
            <Label>State *</Label>
            <Select
              value={stateId || undefined}
              onValueChange={(val) => {
                setStateId(val);
                setDistrictId("");
              }}
              disabled={!countryId || loading || statesQuery.isFetching}
            >
              <SelectTrigger className="input-validate w-full">
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

          {/* District */}
          <div>
            <Label>District *</Label>
            <Select
              value={districtId || undefined}
              onValueChange={(val) => setDistrictId(val)}
              disabled={!stateId || loading || districtsQuery.isFetching}
            >
              <SelectTrigger className="input-validate w-full">
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
          </div>

          {/* City */}
          <div>
            <Label>City Name *</Label>
            <Input
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter city name"
              className="input-validate w-full"
              required
            />
          </div>

          {/* Status */}
          <div>
            <Label>Active Status *</Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger className="input-validate w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
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
