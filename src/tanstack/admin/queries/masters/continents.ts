import { useMemo } from "react";
import type { SelectOption } from "@/types/forms";
import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { ContinentRecord } from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.continents;

export function useContinentsQuery() {
  return enterpriseQuery<ContinentRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.continents.list(),
  });
}

export function useContinentsSelectOptions() {
  const query = useContinentsQuery();

  const selectOptions = useMemo<SelectOption<string>[]>(() => {
    if (!query.data) return [];

    return query.data
      .filter((item) => Boolean(item.is_active))
      .map((item) => ({
        value: String(item.unique_id),
        label: item.name,
      }));
  }, [query.data]);

  return {
    ...query,
    selectOptions,
  } as const;
}
