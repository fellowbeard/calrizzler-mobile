import type { Account } from "./account";
import type { Appointment } from "./appointment";
import type { Client } from "./client";
import type { Resource } from "./resource";
import type { Service } from "./service";
import type { User } from "./user";

export type RecentAppointment = {
  id: number;
  client_id: number;
  scheduled_at: string;
};

export type DashboardData = {
  user: User;
  appointments_count: number;
  account: Account;
  services: Service[];
  resources: Resource[];
  clients: Client[];
  recent_clients: Client[];
  appointments: Appointment[];
  recent_appointments: RecentAppointment[];
};