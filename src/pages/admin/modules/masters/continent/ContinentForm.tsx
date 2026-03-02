import { useEffect, useState, type FormEvent } from "react";
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

import { continentApi } from "@/helpers/admin";
import { encryptSegment } from "@/utils/routeCrypto";
import { masterQueryKeys } from "@/types/tanstack/masters";

/* -----------------------------------------
   Routes
----------------------------------------- */
const encMasters = encryptSegment("masters");
const encContinents = encryptSegment("continents");
const ENC_LIST_PATH = `/${encMasters}/${encContinents}`;

function ContinentForm() {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const detailQueryKey = [
    ...masterQueryKeys.continents,
    "detail",
    id ?? "new",
  ] as const;

  /* -----------------------------------------
     Error Formatter
  ----------------------------------------- */
  const formatErrorMessage = (error: any) => {
    const data = error?.response?.data;

    if (typeof data === "string") return data;

    if (typeof data === "object" && data !== null) {
      return Object.entries(data)
        .map(
          ([key, val]) =>
            `${key}: ${(val as string[]).join(", ")}`
        )
        .join("\n");
    }

    return "Something went wrong while saving.";
  };

  /* -----------------------------------------
     Detail Query (v5 Correct)
  ----------------------------------------- */
  const detailQuery = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => continentApi.get(id as string),
    enabled: isEdit,
  });

  /* -----------------------------------------
     Handle Query Side Effects
  ----------------------------------------- */
  useEffect(() => {
    if (detailQuery.data) {
      setName(detailQuery.data.name);
      setIsActive(detailQuery.data.is_active);
    }
  }, [detailQuery.data]);

  useEffect(() => {
    if (detailQuery.isError) {
      Swal.fire({
        icon: "error",
        title: "Failed to load continent",
        text: formatErrorMessage(detailQuery.error),
      });
    }
  }, [detailQuery.isError, detailQuery.error]);

  /* -----------------------------------------
     Save Mutation (v5 Correct)
  ----------------------------------------- */
  const saveMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      is_active: boolean;
    }) =>
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
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: formatErrorMessage(error),
      });
    },
  });

  const isSubmitting = saveMutation.isPending; 

  /* -----------------------------------------
     Submit Handler
  ----------------------------------------- */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      is_active: isActive,
    });
  };

  /* -----------------------------------------
     Render
  ----------------------------------------- */
  return (
    <ComponentCard
      title={isEdit ? "Edit Continent" : "Add Continent"}
    >
      <form onSubmit={handleSubmit} noValidate>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter continent name"
              required
              disabled={detailQuery.isFetching}
            />
          </div>

          {/* Active Status */}
          <div>
            <Label htmlFor="isActive">
              Active Status{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) =>
                setIsActive(val === "true")
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
