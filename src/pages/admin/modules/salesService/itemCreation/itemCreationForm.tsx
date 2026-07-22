import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  itemCreationServiceApi,
  itemTypeServiceApi,
  scrapSalesCategoryServiceApi,
  siteApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { ItemCreation } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function ItemCreationForm() {
  const [itemTypeId, setItemTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [itemName, setItemName] = useState("");
  const [purposeApplication, setPurposeApplication] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [itemTypeOptions, setItemTypeOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [siteOptions, setSiteOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encItemCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encItemCreation}`;

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [itemTypes, categories, sites] = await Promise.all([
          itemTypeServiceApi.list(),
          scrapSalesCategoryServiceApi.list(),
          siteApi.list(),
        ]);

        setItemTypeOptions(
          toOptions(
            itemTypes as unknown[],
            (item) => item.unique_id,
            (item) => item.item_type,
          ),
        );
        setCategoryOptions(
          toOptions(
            categories as unknown[],
            (item) => item.unique_id,
            (item) => item.category_name,
          ),
        );
        setSiteOptions(
          toOptions(
            sites as unknown[],
            (item) => item.unique_id,
            (item) => item.site_name,
          ),
        );
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load dropdown options",
          text: "Something went wrong!",
        });
      }
    };

    loadOptions();
  }, []);

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await itemCreationServiceApi.get(id as string);
        const data = (res?.data || res) as ItemCreation;

        setItemTypeId(data.item_type_id ?? "");
        setCategoryId(data.category_id ?? "");
        setSiteId(data.site_id ?? "");
        setItemName(data.item_name ?? "");
        setPurposeApplication(data.purpose_application ?? "");
        setDescription(data.description ?? "");
        setIsActive(data.is_active ?? true);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load item",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     SUBMIT HANDLER
  ----------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      item_type_id: itemTypeId,
      category_id: categoryId,
      site_id: siteId,
      item_name: itemName.trim(),
      purpose_application: purposeApplication.trim() || null,
      description: description.trim() || null,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await itemCreationServiceApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await itemCreationServiceApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.item_name?.[0] ||
        error?.response?.data?.item_type_id?.[0] ||
        error?.response?.data?.category_id?.[0] ||
        error?.response?.data?.site_id?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save item.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || fetching;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Item" : "Add Item"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Item Type *</Label>
              <Select
                value={itemTypeId}
                onValueChange={setItemTypeId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category Name *</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Item Name *</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item Name"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Site Name *</Label>
              <Select
                value={siteId}
                onValueChange={setSiteId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Purpose Application</Label>
              <Input
                value={purposeApplication}
                onChange={(e) => setPurposeApplication(e.target.value)}
                placeholder="Purpose Application"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Active Status *</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(value) => setIsActive(value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                disabled={isFormDisabled}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
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
    </div>
  );
}
