import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import type { Appointment } from "@/types/appointment";
import type { Client } from "@/types/client";
import type { Resource } from "@/types/resource";
import type { Service } from "@/types/service";

export type AppointmentFormValues = {
  client_id: number;
  resource_id: number;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  service_ids: number[];
};

type AppointmentFormProps = {
  initialValues?: Appointment | null;
  clients: Client[];
  resources: Resource[];
  services: Service[];
  submitLabel: string;
  isSaving: boolean;
  error?: string;
  onSubmit: (values: AppointmentFormValues) => void | Promise<void>;
};

export function AppointmentForm({
  initialValues,
  clients,
  resources,
  services,
  submitLabel,
  isSaving,
  error,
  onSubmit,
}: AppointmentFormProps) {
  const [clientId, setClientId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  useEffect(() => {
    if (!initialValues) return;

    setClientId(String(initialValues.client_id ?? ""));
    setResourceId(String(initialValues.resource_id ?? ""));
    setScheduledAt(initialValues.scheduled_at ?? "");
    setStatus(initialValues.status ?? "scheduled");
    setDurationMinutes(
      initialValues.duration_minutes === null ||
        initialValues.duration_minutes === undefined
        ? ""
        : String(initialValues.duration_minutes)
    );
    setSelectedServiceIds(
      initialValues.services?.map((service) => service.id) ?? []
    );
  }, [initialValues]);

  function toggleService(serviceId: number) {
    setSelectedServiceIds((currentIds) =>
      currentIds.includes(serviceId)
        ? currentIds.filter((id) => id !== serviceId)
        : [...currentIds, serviceId]
    );
  }

  function handleSubmit() {
    onSubmit({
      client_id: Number(clientId),
      resource_id: Number(resourceId),
      scheduled_at: scheduledAt,
      status,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      service_ids: selectedServiceIds,
    });
  }

  return (
    <View style={{ gap: 12 }}>
      <Text>Client</Text>
      {clients.map((client) => (
        <Button
          key={client.id}
          title={`${client.first_name} ${client.last_name}`}
          onPress={() => setClientId(String(client.id))}
          color={clientId === String(client.id) ? "#444" : undefined}
        />
      ))}

      <Text>Resource</Text>
      {resources.map((resource) => (
        <Button
          key={resource.id}
          title={resource.name}
          onPress={() => setResourceId(String(resource.id))}
          color={resourceId === String(resource.id) ? "#444" : undefined}
        />
      ))}

      <Text>Scheduled At</Text>
      <TextInput
        placeholder="YYYY-MM-DDTHH:mm:ss"
        value={scheduledAt}
        onChangeText={setScheduledAt}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Text>Status</Text>
      {["scheduled", "completed", "canceled"].map((statusOption) => (
        <Button
          key={statusOption}
          title={statusOption}
          onPress={() => setStatus(statusOption)}
          color={status === statusOption ? "#444" : undefined}
        />
      ))}

      <Text>Duration Override</Text>
      <TextInput
        placeholder="Leave blank to use service duration"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        keyboardType="number-pad"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Text>Services</Text>
      {services.map((service) => (
        <Button
          key={service.id}
          title={
            selectedServiceIds.includes(service.id)
              ? `✓ ${service.title}`
              : service.title
          }
          onPress={() => toggleService(service.id)}
          color={selectedServiceIds.includes(service.id) ? "#444" : undefined}
        />
      ))}

      {error ? <Text>{error}</Text> : null}

      <Button
        title={isSaving ? "Saving..." : submitLabel}
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </View>
  );
}