import { useEffect } from "react";
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

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { continentApi } from "@/helpers/admin";
import { encryptSegment } from "@/utils/routeCrypto";
import { masterQueryKeys } from "@/types/tanstack/masters";

import {
  continentSchema,
  type ContinentFormValues,
} from "@/validations/masters/continent.schema";

/* -----------------------------------------
   Routes
----------------------------------------- */
const encMasters = encryptSegment("masters");
const encContinents = encryptSegment("continents");
const ENC_LIST_PATH = `/${encMasters}/${encContinents}`;

function ContinentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  /* -----------------------------------------
     React Hook Form + Zod
  ----------------------------------------- */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContinentFormValues>({
    resolver: zodResolver(continentSchema),
    defaultValues: {
      name: "",
      is_active: true,
    },
  });

  /* -----------------------------------------
     Detail Query (Edit Mode)
  ----------------------------------------- */
  const detailQuery = useQuery({
    queryKey: [
      ...masterQueryKeys.continents,
      "detail",
      id ?? "new",
    ],
    queryFn: () => continentApi.get(id as string),
    enabled: isEdit,
  });

  /* -----------------------------------------
     Populate form in Edit mode
  ----------------------------------------- */
  useEffect(() => {
    if (detailQuery.data) {
      setValue("name", detailQuery.data.name);
      setValue("is_active", detailQuery.data.is_active);
    }
  }, [detailQuery.data, setValue]);

  /* -----------------------------------------
     Save Mutation
  ----------------------------------------- */
  const saveMutation = useMutation({
    mutationFn: (payload: ContinentFormValues) =>
      isEdit
        ? continentApi.update(id as string, payload)
        : continentApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: masterQueryKeys.continents,
      });

      Swal.fire({
        icon: "success",
        title: isEdit
          ? "Updated successfully!"
          : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    },

    onError: (error: any) => {
      const data = error?.response?.data;

      let message = "Something went wrong while saving.";

      if (typeof data === "string") message = data;
      else if (typeof data === "object" && data !== null) {
        message = Object.entries(data)
          .map(
            ([key, val]) =>
              `${key}: ${(val as string[]).join(", ")}`
          )
          .join("\n");
      }

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    },
  });

  const isSubmitting = saveMutation.isPending;

  /* -----------------------------------------
     Submit Handler (Zod validated)
  ----------------------------------------- */
  const onSubmit = (data: ContinentFormValues) => {
    saveMutation.mutate({
      name: data.name.trim(),
      is_active: data.is_active,
    });
  };

  /* -----------------------------------------
     Render
  ----------------------------------------- */
  return (
    <ComponentCard
      title={isEdit ? "Edit Continent" : "Add Continent"}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Continent Name */}
          <div>
            <Label htmlFor="continentName">
              Continent Name{" "}
              <span className="text-red-500">*</span>
            </Label>

            <Input
              id="continentName"
              type="text"
              {...register("name")}
              placeholder="Enter continent name"
              disabled={detailQuery.isFetching}
            />

            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div>
            <Label htmlFor="isActive">
              Active Status{" "}
              <span className="text-red-500">*</span>
            </Label>

            <Select
              value={watch("is_active") ? "true" : "false"}
              onValueChange={(val) =>
                setValue("is_active", val === "true")
              }
              disabled={detailQuery.isFetching}
            >
              <SelectTrigger
                id="isActive"
                className="w-full"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="true">
                  Active
                </SelectItem>
                <SelectItem value="false">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>

            {errors.is_active && (
              <p className="text-red-500 text-sm mt-1">
                {errors.is_active.message}
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
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

export default ContinentForm;