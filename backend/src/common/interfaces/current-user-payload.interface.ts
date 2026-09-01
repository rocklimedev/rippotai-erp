export interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
}
