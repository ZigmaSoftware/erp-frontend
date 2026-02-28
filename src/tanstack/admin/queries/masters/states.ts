import { commonMasterApi } from "@/helpers/admin/registry";
import { enterpriseQuery } from "../enterpriseQuery";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { StateRecord } from "@/types/tanstack/masters";

const queryKey = masterQueryKeys.states;

export function useStatesQuery() {
  return enterpriseQuery<StateRecord[]>({
    queryKey,
    queryFn: () => commonMasterApi.states.list(),
  });
}
