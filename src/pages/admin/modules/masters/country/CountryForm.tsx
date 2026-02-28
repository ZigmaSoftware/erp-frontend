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
import { countryApi, useContinentsSelectOptions } from "@/helpers/admin";
import type { CountryRecord } from "@/types/tanstack/masters";
import { masterQueryKeys } from "@/types/tanstack/masters";

const encMasters = encryptSegment("masters");
const encCountries = encryptSegment("countries");
const ENC_LIST_PATH = `/${encMasters}/${encCountries}`;

const normalizeNullableId = (
  value: string | number | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
};

function CountryForm() {
  const [name, setName] = useState("");
  const [mobCode, setMobCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [continentId, setContinentId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const detailQueryKey = [
    ...masterQueryKeys.countries,
    "detail",
    id ?? "new",
  ] as const;

  const continentsQuery = useContinentsSelectOptions();
  const continentOptions = continentsQuery.selectOptions;

  const detailQuery = useQuery<CountryRecord>({
    queryKey: detailQueryKey,
    queryFn: () => countryApi.get(id as string),
    enabled: isEdit,
  });
  console.log(detailQuery);

  useEffect(() => {
    if (detailQuery.isError) {
      Swal.fire({
        icon: "error",
        title: "Failed to load country",
        text: extractErrorMessage(detailQuery.error),
      });
    }
  }, [detailQuery.isError, detailQuery.error]);

  useEffect(() => {
    if (!detailQuery.data) return;

    setName(detailQuery.data.name ?? "");
    setMobCode(detailQuery.data.mob_code ?? "");
    setCurrency(detailQuery.data.currency ?? "");
    setIsActive(Boolean(detailQuery.data.is_active));

    const resolvedContinentId = normalizeNullableId(
      detailQuery.data.continent_id ?? detailQuery.data.continent
    );
    setContinentId(resolvedContinentId ?? "");
  }, [detailQuery.data]);

  useEffect(() => {
    if (continentsQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load continents",
        text: extractErrorMessage(continentsQuery.error),
      });
    }
  }, [continentsQuery.error]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      mob_code: string;
      currency: string;
      continent_id: string;
      is_active: boolean;
    }) =>
      isEdit
        ? countryApi.update(id as string, payload)
        : countryApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.countries,
      });
      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
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

    if (!name.trim() || !continentId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all the required fields before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      mob_code: mobCode.trim(),
      currency: currency.trim(),
      continent_id: continentId,
      is_active: isActive,
    });
  };

  return (
    <ComponentCard title={isEdit ? "Edit Country" : "Add Country"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="continent">
              Continent Name <span className="text-red-500">*</span>
            </Label>
            <Select
              value={continentId || undefined}
              onValueChange={(val) => setContinentId(val)}
              disabled={isDetailLoading}
            >
              <SelectTrigger className="input-validate w-full" id="continent">
                <SelectValue placeholder="Select Continent" />
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
            <Label htmlFor="countryName">
              Country Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="countryName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter country name"
              className="input-validate w-full"
              required
              disabled={isDetailLoading}
            />
          </div>

          <div>
            <Label htmlFor="mobCode">Mobile Code</Label>
            <Input
              id="mobCode"
              type="text"
              value={mobCode}
              onChange={(e) => setMobCode(e.target.value)}
              placeholder="Enter mobile code"
              className="w-full"
              disabled={isDetailLoading}
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="Enter currency"
              className="w-full"
              disabled={isDetailLoading}
            />
          </div>

          <div>
            <Label htmlFor="isActive">
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
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
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>
          <Button type="button" variant="destructive" onClick={() => navigate(ENC_LIST_PATH)}>
            Cancel
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}

export default CountryForm;
