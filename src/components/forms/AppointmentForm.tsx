import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import type { Appointment } from "@/types/appointment";
import type { Client } from "@/types/client";
import type { Resource } from "@/types/resource";
import type { Service } from "@/types/service";

export type AppointmentFormValues = {
  client_id: number;
  resource_id: number | null;
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
  onNewClient: () => void;
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
  onNewClient,
  onSubmit,
}: AppointmentFormProps) {
  const [clientId, setClientId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [scheduledAt, setScheduledAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState("scheduled");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  useEffect(() => {
    if (!initialValues) return;

    setClientId(String(initialValues.client_id ?? ""));
    setResourceId(String(initialValues.resource_id ?? ""));
    setScheduledAt(
      initialValues.scheduled_at
        ? new Date(initialValues.scheduled_at)
        : new Date()
    );
    setStatus(initialValues.status ?? "scheduled");
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
      resource_id: resourceId ? Number(resourceId) : null,
      scheduled_at: scheduledAt.toISOString(),
      status,
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      service_ids: selectedServiceIds,
    });
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <Text>Client</Text>

      <View style={{ borderWidth: 1, borderRadius: 8 }}>
        <Picker
          selectedValue={clientId}
          onValueChange={(value) => {
            if (value === "new") {
              onNewClient();
              return;
            }

            setClientId(String(value));
          }}
        >
          <Picker.Item label="+ New Client" value="new" />
          <Picker.Item label="Select a client" value="" />

          {clients.map((client) => (
            <Picker.Item
              key={client.id}
              label={`${client.first_name} ${client.last_name}`}
              value={String(client.id)}
            />
          ))}
        </Picker>
      </View>

      <Text>Resource</Text>

      <View style={{ borderWidth: 1, borderRadius: 8 }}>
        <Picker
          selectedValue={resourceId}
          onValueChange={(value) => setResourceId(String(value))}
        >
          <Picker.Item label="Select a resource" value="" />

          {resources.map((resource) => (
            <Picker.Item
              key={resource.id}
              label={resource.name}
              value={String(resource.id)}
            />
          ))}
        </Picker>
      </View>

      <Text>Scheduled At</Text>

      <Button
        title={scheduledAt.toLocaleString()}
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker ? (
        <DateTimePicker
          value={scheduledAt}
          mode="datetime"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);

            if (selectedDate) {
              setScheduledAt(selectedDate);
            }
          }}
        />
      ) : null}

      <Text>Status</Text>

      <View style={{ borderWidth: 1, borderRadius: 8 }}>
        <Picker
          selectedValue={status}
          onValueChange={(value) => setStatus(String(value))}
        >
          <Picker.Item label="Scheduled" value="scheduled" />
          <Picker.Item label="Completed" value="completed" />
          <Picker.Item label="Canceled" value="canceled" />
        </Picker>
      </View>

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
              ? `✓ ${service.title} — ${service.duration_minutes} min`
              : `${service.title} — ${service.duration_minutes} min`
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
    </ScrollView>
  );
}