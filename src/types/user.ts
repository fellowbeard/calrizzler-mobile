export type User = {
  id: number;
  account_id: number;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};
