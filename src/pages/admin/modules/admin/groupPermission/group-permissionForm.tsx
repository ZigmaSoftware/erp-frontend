import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEncryptedRoute } from "@/utils/routeCache";
import { groupPermissionApi, permissionApi, userRoleApi } from "@/helpers/admin";

const { encAdmins, encGroupPermission } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encAdmins}/${encGroupPermission}`;

type GroupPermissionRecord = {
  id?: string | number;
  group_id: number;
  permission_ids?: number[];
};

type UserRoleRecord = {
  id: string;
  group_id: number;
  name: string;
  is_active: boolean;
};

type PermissionRecord = {
  id: number;
  codename: string;
  name: string;
  content_type: number;
};

type GroupOption = {
  value: string;
  label: string;
};

type PermissionOption = {
  value: string;
  label: string;
};

const normalizeList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  if (
    payload &&
    typeof payload === "object" &&
    "results" in payload &&
    Array.isArray((payload as { results?: unknown[] }).results)
  ) {
    return (payload as { results: T[] }).results;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown[] }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: { results?: unknown } }).data &&
    Array.isArray((payload as { data?: { results?: unknown[] } }).data?.results)
  ) {
    return (payload as { data: { results: T[] } }).data.results;
  }

  return [];
};

const normalizePermissionIds = (ids: number[] | undefined): number[] => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
};

export default function GroupPermissionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [groupId, setGroupId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);

  const permissionNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const option of permissionOptions) {
      map.set(Number(option.value), option.label);
    }
    return map;
  }, [permissionOptions]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);

        const [roleRes, permissionRes] = await Promise.all([
          userRoleApi.list(),
          permissionApi.list(),
        ]);

        const roles = normalizeList<UserRoleRecord>(roleRes)
          .filter((role) => role.is_active !== false)
          .map((role) => ({
            value: String(role.group_id),
            label: role.name,
          }));

        const uniqueRoles = new Map<string, GroupOption>();
        for (const role of roles) {
          if (!uniqueRoles.has(role.value)) {
            uniqueRoles.set(role.value, role);
          }
        }

        const permissions = normalizeList<PermissionRecord>(permissionRes).map(
          (permission) => ({
            value: String(permission.id),
            label: permission.name,
          })
        );

        setGroupOptions(Array.from(uniqueRoles.values()));
        setPermissionOptions(permissions);
      } catch (error) {
        console.error("Unable to load dropdown options", error);
        Swal.fire("Error", "Unable to load role/permission options", "error");
      } finally {
        setOptionsLoading(false);
      }
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadRecord = async () => {
      try {
        const data = await groupPermissionApi.get(id);
        const response = (data?.data ?? data) as GroupPermissionRecord;

        const nextGroupId = Number(response.group_id);
        setGroupId(
          Number.isInteger(nextGroupId) && nextGroupId > 0 ? String(nextGroupId) : ""
        );
        setSelectedPermissionIds(normalizePermissionIds(response.permission_ids));
      } catch (error) {
        console.error("Unable to load group permission", error);
        Swal.fire("Error", "Unable to load group permission record", "error");
      }
    };

    void loadRecord();
  }, [id, isEdit]);

  const validate = (): boolean => {
    if (!groupId) {
      Swal.fire("Validation Error", "Please select a group role", "error");
      return false;
    }

    if (selectedPermissionIds.length === 0) {
      Swal.fire("Validation Error", "Please select at least one permission", "error");
      return false;
    }

    return true;
  };

  const togglePermission = (permissionId: number, checked: boolean) => {
    setSelectedPermissionIds((prev) => {
      if (checked) {
        return prev.includes(permissionId) ? prev : [...prev, permissionId];
      }
      return prev.filter((idValue) => idValue !== permissionId);
    });
  };

  const handleSelectAllPermissions = () => {
    const allIds = permissionOptions
      .map((permission) => Number(permission.value))
      .filter((idValue) => Number.isInteger(idValue) && idValue > 0);
    setSelectedPermissionIds(allIds);
  };

  const handleDeselectAllPermissions = () => {
    setSelectedPermissionIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      group_id: Number(groupId),
      permission_ids: selectedPermissionIds,
    };

    try {
      setLoading(true);
      if (isEdit && id) {
        await groupPermissionApi.update(id, payload);
      } else {
        await groupPermissionApi.create(payload);
      }

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Group Permission Updated" : "Group Permission Added",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      console.error("Save failed", error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Unable to save group permission.";
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Group Permission" : "Add Group Permission"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Select value={groupId || undefined} onValueChange={setGroupId}>
              <SelectTrigger className="input-validate w-full">
                <SelectValue
                  placeholder={optionsLoading ? "Loading groups..." : "Select Group Role"}
                />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              Permissions <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAllPermissions}
                className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
              >
                Deselect All
              </button>
            </div>
            <div className="input-validate w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm h-40 overflow-y-auto">
              {permissionOptions.map((permission) => (
                <label
                  key={permission.value}
                  className="flex items-center gap-2 py-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedPermissionIds.includes(Number(permission.value))}
                    onCheckedChange={(checked) =>
                      togglePermission(Number(permission.value), Boolean(checked))
                    }
                  />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* <div className="md:col-span-2">
            <Label>Selected Permissions</Label>
            {selectedPermissionIds.length === 0 ? (
              <p className="text-sm text-gray-500">No permissions selected.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "80px" }}>S.No</TableHead>
                    <TableHead style={{ width: "140px" }}>ID</TableHead>
                    <TableHead>Permission Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPermissionIds.map((idValue, index) => (
                    <TableRow key={idValue}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{idValue}</TableCell>
                      <TableCell>
                        {permissionNameMap.get(idValue) ?? `Permission ${idValue}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div> */}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(ENC_LIST_PATH)}
            className="bg-red-400 px-4 py-2 text-white rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-custom px-4 py-2 text-white rounded"
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
