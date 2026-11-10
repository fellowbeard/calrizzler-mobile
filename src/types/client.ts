// src/types/client.ts
import type { Appointment } from "./appointment";
import type { Note } from "./note";

export type Client = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

export type ClientDetail = Client & {
  account_id: number;
  notes: Note[];
  appointments: Appointment[];
};
