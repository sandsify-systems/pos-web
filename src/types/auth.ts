
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  tenant_id: string;
  outlet_id?: string;
  is_verified: boolean;
  active?: boolean;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  currency: string;
  tenant_id: string;
  subscription_status?: string;
  subscription_expiry?: string;
  data_retention_months?: number;
  auto_archive_enabled?: boolean;
  archive_frequency?: string;
  google_drive_linked?: boolean;
  active_modules?: string[];
  table_management_enabled?: boolean;
  save_to_draft_enabled?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
  business?: Business;
  requires_otp?: boolean;
}
