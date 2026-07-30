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
  duration_minutes: number;
  duration_overridden: boolean;
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

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

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
  const [hasManualDurationOverride, setHasManualDurationOverride] =
    useState(false);
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

    setDurationMinutes(
      initialValues.duration_minutes != null
        ? String(initialValues.duration_minutes)
        : ""
    );

    setHasManualDurationOverride(initialValues.duration_overridden ?? false);

    setSelectedServiceIds(
      initialValues.services?.map((service) => service.id) ?? []
    );
  }, [initialValues]);

  function calculateServiceDuration(serviceIds: number[]) {
    return services
      .filter((service) => serviceIds.includes(service.id))
      .reduce(
        (total, service) => total + Number(service.duration_minutes || 0),
        0
      );
  }

  function toggleService(serviceId: number) {
    const updatedServiceIds = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];

    setSelectedServiceIds(updatedServiceIds);

    if (!hasManualDurationOverride) {
      const totalDuration = calculateServiceDuration(updatedServiceIds);

      setDurationMinutes(totalDuration > 0 ? String(totalDuration) : "");
    }
  }

  function handleUseServiceDuration() {
    const totalDuration = calculateServiceDuration(selectedServiceIds);

    setDurationMinutes(totalDuration > 0 ? String(totalDuration) : "");

    setHasManualDurationOverride(false);
  }

  function handleSubmit() {
    const parsedDuration = Number(durationMinutes);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return;
    }

    onSubmit({
      client_id: Number(clientId),
      resource_id: resourceId ? Number(resourceId) : null,
      scheduled_at: scheduledAt.toISOString(),
      status,
      duration_minutes: parsedDuration,
      duration_overridden: hasManualDurationOverride,
      service_ids: selectedServiceIds,
    });
  }

  const hasValidDuration =
    Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0;

  const serviceDurationTotal = calculateServiceDuration(selectedServiceIds);

  return (
    <ScrollView
      contentContainerStyle={{
        gap: 12,
        paddingBottom: 40,
      }}
    >
      <Text>Client</Text>

      <View
        style={{
          borderWidth: 1,
          borderRadius: 8,
        }}
      >
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

      <View
        style={{
          borderWidth: 1,
          borderRadius: 8,
        }}
      >
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

      <View
        style={{
          borderWidth: 1,
          borderRadius: 8,
        }}
      >
        <Picker
          selectedValue={status}
          onValueChange={(value) => setStatus(String(value))}
        >
          <Picker.Item label="Scheduled" value="scheduled" />
          <Picker.Item label="Completed" value="completed" />
          <Picker.Item label="Canceled" value="canceled" />
        </Picker>
      </View>

      <Text>Total Appointment Duration</Text>

      <TextInput
        placeholder="Total time in minutes"
        value={durationMinutes}
        onChangeText={(value) => {
          setDurationMinutes(value);
          setHasManualDurationOverride(true);
        }}
        keyboardType="number-pad"
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      {durationMinutes && Number(durationMinutes) > 0 ? (
        <Text>Total time: {formatDuration(Number(durationMinutes))}</Text>
      ) : null}

      {hasManualDurationOverride ? (
        <>
          <Text>Service duration: {formatDuration(serviceDurationTotal)}</Text>

          <Button
            title="Use Service Duration"
            onPress={handleUseServiceDuration}
          />
        </>
      ) : null}

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
        disabled={isSaving || !hasValidDuration}
      />
    </ScrollView>
  );
}
