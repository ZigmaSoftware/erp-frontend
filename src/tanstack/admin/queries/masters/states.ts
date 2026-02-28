import { useMemo } from "react";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { StateRecord, StateSelectOption } from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.states;

export function useStatesQuery() {
  return enterpriseQuery<StateRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.states.list(),
  });
}

const normalizeNullable = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return String(value);
};

export function useStatesSelectOptions() {
  const query = useStatesQuery();

  const selectOptions = useMemo<StateSelectOption[]>(() => {
    if (!query.data) return [];

    return query.data.map((state) => ({
      value: String(state.unique_id),
      label: state.name,
      isActive: Boolean(state.is_active),
      countryId: normalizeNullable(state.country_id),
      continentId: normalizeNullable(state.continent_id),
    }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
