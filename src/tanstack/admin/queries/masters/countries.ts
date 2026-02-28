import { useMemo } from "react";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import {
  normalizeCountryData,
} from "@/types/tanstack/masters";
import type { CountryRecord, NormalizedCountry } from "@/types/tanstack/masters";

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
