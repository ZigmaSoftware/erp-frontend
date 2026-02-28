import type { SelectOption } from "@/types/forms";

export * from "./keys";

export type ContinentRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
};

export type CountryRecord = {
  unique_id: string | number;
  name: string;
  continent_id?: string | number | null;
  continent?: string | number | null;
  is_active: boolean;
  mob_code?: string;
  currency?: string;
};

export type NormalizedCountry = {
  id: string;
  name: string;
  continentId: string | null;
  isActive: boolean;
};

export const normalizeCountryData = (
  countries: CountryRecord[]
): NormalizedCountry[] =>
  countries.map((country) => {
    const rawContinentId = country.continent_id ?? country.continent;

    return {
      id: String(country.unique_id),
      name: country.name,
      continentId: rawContinentId == null ? null : String(rawContinentId),
      isActive: Boolean(country.is_active),
    };
  });

export type StateRecord = {
  unique_id: string | number;
  name: string;
  label: string;
  is_active: boolean;
  continent_id?: string | number | null;
  country_id?: string | number | null;
  continent_name?: string;
  country_name?: string;
};

export type DistrictRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
  continent_id?: string | number | null;
  country_id?: string | number | null;
  state_id?: string | number | null;
  country_name?: string;
  state_name?: string;
};

export type CityRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
  continent_id?: string | number | null;
  country_id?: string | number | null;
  state_id?: string | number | null;
  district_id?: string | number | null;
  continent_name?: string;
  country_name?: string;
  state_name?: string;
  district_name?: string;
};

type MasterSelectOption<Value = string> = SelectOption<Value> & {
  isActive: boolean;
};

export type CountrySelectOption = MasterSelectOption<string> & {
  continentId: string | null;
};

export type StateSelectOption = MasterSelectOption<string> & {
  countryId: string | null;
  continentId: string | null;
};

export type DistrictSelectOption = MasterSelectOption<string> & {
  stateId: string | null;
  countryId: string | null;
  continentId: string | null;
};

export type CitySelectOption = MasterSelectOption<string> & {
  districtId: string | null;
  stateId: string | null;
  countryId: string | null;
  continentId: string | null;
};
