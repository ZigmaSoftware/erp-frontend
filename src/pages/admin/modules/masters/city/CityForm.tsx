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

import type { CityRecord } from "@/types/tanstack/masters";

/* ---------------- ROUTES ---------------- */

const encMasters = encryptSegment("masters");
const encCities = encryptSegment("cities");
const ENC_LIST_PATH = `/${encMasters}/${encCities}`;

/* ==========================================================
    COMPONENT
========================================================== */

export default function CityForm() {
  /* ---------------- STATE ---------------- */

  const [cityName, setCityName] = useState("");
  const [continentId, setContinentId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [isActive, setIsActive] = useState("true");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Track whether edit data has been populated (non-edit forms are ready immediately)
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

  // Wait for all option lists to be fetched before populating edit values
  const queriesReady =
    continentsQuery.isSuccess &&
    countriesQuery.isSuccess &&
    statesQuery.isSuccess &&
    districtsQuery.isSuccess;

  /* ---------------- FILTERED OPTIONS ---------------- */

  const filteredCountries = useMemo(() => {
    if (!continentId) return [];
    return countryOptions.filter((opt) => opt.continentId === continentId);
  }, [continentId, countryOptions]);

  const filteredStates = useMemo(() => {
    if (!countryId) return [];
    return stateOptions.filter((opt) => opt.countryId === countryId);
  }, [countryId, stateOptions]);

  const filteredDistricts = useMemo(() => {
    if (!stateId) return [];
    return districtOptions.filter((opt) => opt.stateId === stateId);
  }, [stateId, districtOptions]);

  /* ---------------- EDIT LOAD ---------------- */

  useEffect(() => {
    if (!isEdit || !id) return;
    // Wait until all dropdown option lists are loaded — otherwise the Select
    // components render with a value that has no matching option and show blank.
    if (!queriesReady) return;

    let mounted = true;

    (async () => {
      try {
        const data: CityRecord = await cityApi.get(id);

        if (!mounted) return;

        setCityName(data.name ?? "");
        setContinentId(String(data.continent_id ?? ""));
        setCountryId(String(data.country_id ?? ""));
        setStateId(String(data.state_id ?? ""));
        setDistrictId(String(data.district_id ?? ""));
        setIsActive(data.is_active ? "true" : "false");
        setEditLoaded(true);
      } catch (err) {
        Swal.fire("Error", extractErrorMessage(err), "error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, isEdit, queriesReady]); // queriesReady as dependency ensures options exist before IDs are set

  /* ---------------- SUBMIT ---------------- */

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
        is_active: isActive === "true",
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
      {/* Show loader until both option queries AND edit record are ready */}
      {!editLoaded ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  setDistrictId("");
                }}
                disabled={loading}
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
                  setDistrictId("");
                }}
                disabled={!continentId || loading}
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
                onValueChange={(val) => {
                  setStateId(val);
                  setDistrictId("");
                }}
                disabled={!countryId || loading}
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

            {/* District */}
            <div>
              <Label>District *</Label>
              <Select
                value={districtId}
                onValueChange={(val) => setDistrictId(val)}
                disabled={!stateId || loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDistricts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Name */}
            <div>
              <Label>City Name *</Label>
              <Input
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Enter city name"
                required
              />
            </div>

            {/* Status */}
            <div>
              <Label>Status *</Label>
              <Select
                value={isActive}
                onValueChange={(val) => setIsActive(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
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
      )}
    </ComponentCard>
  );
}