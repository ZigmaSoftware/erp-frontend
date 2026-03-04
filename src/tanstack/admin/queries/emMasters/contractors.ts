import { contractorApi } from "@/helpers/admin";
import { masterQueryKeys } from "@/types/tanstack/masters";
import type { ContractorRecord } from "@/types/tanstack/masters";
import { enterpriseQuery } from "../enterpriseQuery";

const queryKey = masterQueryKeys.contractors;

export function useContractorsQuery() {
  return enterpriseQuery<ContractorRecord[]>({
    queryKey,
    queryFn: () => contractorApi.list(),
  });
}
