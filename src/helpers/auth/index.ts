import authApi from "@/api/auth";
import { createCrudHelpers } from "@/helpers/admin/crudHelpers";

export const authUserApi = createCrudHelpers("users", authApi);
export const authRoleApi = createCrudHelpers("roles", authApi);
