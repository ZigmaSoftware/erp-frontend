import { useMemo } from "react";
import type { CountryRecord, CountrySelectOption, NormalizedCountry } from "@/types/tanstack/masters";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import {
  normalizeCountryData,
} from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.countries;

export function useCountriesQuery() {
  return enterpriseQuery<CountryRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.countries.list(),
  });
}

export function useCountriesNormalized() {
  const query = useCountriesQuery();

  const normalized = useMemo<NormalizedCountry[]>(() => {
    if (!query.data) return [];
    return normalizeCountryData(query.data);
  }, [query.data]);

  return {
    ...query,
    normalized,
  } as const;
}

export function useCountriesSelectOptions() {
  const query = useCountriesNormalized();

  const selectOptions = useMemo<CountrySelectOption[]>(() => {
    return query.normalized.map((country) => ({
      value: country.id,
      label: country.name,
      isActive: country.isActive,
      continentId: country.continentId,
    }));
  }, [query.normalized]);

  return {
    ...query,
    selectOptions,
  } as const;
}
