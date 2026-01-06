import { useEffect, useState } from "react";
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

import { encryptSegment } from "@/utils/routeCrypto";
import {
  getPlantById,
  updatePlant,
  addPlant,
} from "@/utils/plantsStorage";

const encMasters = encryptSegment("masters");
const encPlantCreation = encryptSegment("plant-creation");
const ENC_LIST_PATH = `/${encMasters}/${encPlantCreation}`;

function PlantForm() {
  const [plantName, setPlantName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  /** Load plant for edit */
  useEffect(() => {
    if (isEdit && id) {
      const plant = getPlantById(id);

      if (!plant) {
        Swal.fire("Error", "Plant not found", "error");
        navigate(ENC_LIST_PATH);
        return;
      }

      setPlantName(plant.plantName);
      setSiteName(plant.siteName);
      setIsActive(plant.is_active);
    }
  }, [id, isEdit, navigate]);

  /** Save / Update */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plantName || !siteName) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoading(true);

    try {
      if (isEdit && id) {
        updatePlant(id, {
          plantName,
          siteName,
          is_active: isActive,
        });

        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        addPlant({
          unique_id: Date.now().toString(),
          plantName,
          siteName,
          is_active: isActive,
        });

        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Plant" : "Add Plant"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plant Name */}
          <div>
            <Label htmlFor="plantName">
              Plant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="plantName"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="Enter plant name"
              required
            />
          </div>

          {/* Site Name */}
          <div>
            <Label htmlFor="siteName">
              Site Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter site name"
              required
            />
          </div>

          {/* Active Status */}
          <div>
            <Label htmlFor="isActive">
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
            >
              <SelectTrigger id="isActive">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
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

export default PlantForm;
