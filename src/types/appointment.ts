// src/types/appointment.ts
import type { Resource } from "./resource";
import type { Service } from "./service";

export type AppointmentClient = {
  id: number;
  first_name: string;
  last_name: string;
};

export type Appointment = {
  id: number;
  user_id: number;
  client_id: number;
  resource_id: number | null;
  client: AppointmentClient | null;
  resource: Resource | null;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  blocking_reservation_time: string;
  uses_default_duration: boolean;
  services: Service[];
};