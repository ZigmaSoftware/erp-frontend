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

/* ---------------- ROUTE ---------------- */

const encMasters = encryptSegment("masters");
const encCountries = encryptSegment("countries");
const ENC_LIST_PATH = `/${encMasters}/${encCountries}`;

/* ---------------- TYPES ---------------- */

type CountryFormValues = {
  name: string;
  mob_code: string;
  currency: string;
  continent_id: string;
  is_active: string; // store as string for Select
};

const buildInitialFormData = (): CountryFormValues => ({
  name: "",
  mob_code: "",
  currency: "",
  continent_id: "",
  is_active: "true",
});

/* ---------------- COMPONENT ---------------- */

function CountryForm() {
  const [formData, setFormData] =
    useState<CountryFormValues>(buildInitialFormData);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  /* ---------------- CONTINENTS ---------------- */

  const continentsQuery = useContinentsSelectOptions();
  const continentOptions = continentsQuery.selectOptions;

  /* ---------------- DETAIL QUERY ---------------- */

  const detailQuery = useQuery<CountryRecord>({
    queryKey: [...masterQueryKeys.countries, "detail", id],
    queryFn: () => countryApi.get(id as string),
    enabled: isEdit,
    refetchOnMount: "always",
  });

  /* ---------------- POPULATE EDIT DATA ---------------- */
useEffect(() => {
  if (!detailQuery.data) return;

  const data = detailQuery.data;

  setFormData({
    name: data.name ?? "",
    mob_code: data.mob_code ?? "",
    currency: data.currency ?? "",
    continent_id: String(data.continent_id ?? ""),
    is_active: data.is_active ? "true" : "false",
  });
}, [detailQuery.data, detailQuery.dataUpdatedAt, continentOptions]);

  /* ---------------- ERROR HANDLING ---------------- */

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
    if (continentsQuery.error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load continents",
        text: extractErrorMessage(continentsQuery.error),
      });
    }
  }, [continentsQuery.error]);

  /* ---------------- MUTATION ---------------- */

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
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

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (name: keyof CountryFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.continent_id) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
      return;
    }

    saveMutation.mutate({
      name: formData.name.trim(),
      mob_code: formData.mob_code.trim(),
      currency: formData.currency.trim(),
      continent_id: formData.continent_id,
      is_active: formData.is_active === "true",
    });
  };

  const isSubmitting = saveMutation.isPending;
  const isLoading = detailQuery.isFetching;

  /* ---------------- UI ---------------- */

  return (
    <ComponentCard title={isEdit ? "Edit Country" : "Add Country"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent */}
          <div>
            <Label htmlFor="continent">
              Continent Name <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.continent_id}
              onValueChange={(v) => handleChange("continent_id", v)}
              disabled={isLoading}
            >
              <SelectTrigger id="continent">
                <SelectValue placeholder="Select Continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Name */}
          <div>
            <Label htmlFor="name">
              Country Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Mobile Code */}
          <div>
            <Label htmlFor="mob_code">Mobile Code</Label>
            <Input
              id="mob_code"
              value={formData.mob_code}
              onChange={(e) => handleChange("mob_code", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Currency */}
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="is_active">
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.is_active}
              onValueChange={(v) => handleChange("is_active", v)}
              disabled={isLoading}
            >
              <SelectTrigger id="is_active">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
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

export default CountryForm;
