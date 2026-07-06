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
};

export type ClientDetail = Client & {
  account_id: number;
  notes: Note[];
  appointments: Appointment[];
};