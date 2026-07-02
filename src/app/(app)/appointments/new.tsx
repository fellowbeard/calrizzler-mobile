import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useClients } from "@/hooks/useClients";
import { useResources } from "@/hooks/useResources";
import { useServices } from "@/hooks/useServices";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useCreateAppointment } from "@/hooks/useCreateAppointment";

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const { clients } = useClients();
  const { resources } = useResources();
  const { services } = useServices();

  const {
    createAppointment,
    error,
    fieldErrors,
    isSaving,
  } = useCreateAppointment();

  const [clientId, setClientId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState("scheduled");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  if (!canWrite(user)) {
    return <Redirect href="/appointments" />;
  }

  async function handleSubmit() {
    const appointment = await createAppointment({
      client_id: Number(clientId),
      resource_id: resourceId ? Number(resourceId) : null,
      scheduled_at: scheduledAt.toISOString(),
      status,
      duration_minutes: durationMinutes
        ? Number(durationMinutes)
        : null,
      service_ids: selectedServiceIds,
    });

    if (appointment) {
      router.replace(`/appointments/${appointment.id}`);
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>
        New Appointment
      </Text>

      <Text style={{ fontSize: 18 }}>Client</Text>

      <Picker
        selectedValue={clientId}
        onValueChange={(value) => setClientId(String(value))}
      >
        <Picker.Item
          label="Select a client..."
          value=""
        />

        {clients.map((client) => (
          <Picker.Item
            key={client.id}
            label={`${client.first_name} ${client.last_name}`}
            value={String(client.id)}
          />
        ))}
      </Picker>

      {fieldErrors.client_id ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.client_id.join(", ")}
        </Text>
      ) : null}

      <Text style={{ fontSize: 18 }}>Resource</Text>

      <Picker
        selectedValue={resourceId}
        onValueChange={(value) => setResourceId(String(value))}
      >
        <Picker.Item label="No resource" value="" />

        {resources.map((resource) => (
          <Picker.Item
            key={resource.id}
            label={resource.name}
            value={String(resource.id)}
          />
        ))}
      </Picker>

      {fieldErrors.resource_id ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.resource_id.join(", ")}
        </Text>
      ) : null}

      <Button
        title={`Appointment Time: ${scheduledAt.toLocaleString()}`}
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker && (
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
      )}

      {fieldErrors.scheduled_at ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.scheduled_at.join(", ")}
        </Text>
      ) : null}

      <TextInput
        placeholder="Status"
        value={status}
        onChangeText={setStatus}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      {fieldErrors.status ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.status.join(", ")}
        </Text>
      ) : null}

      <TextInput
        placeholder="Duration Minutes (optional)"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        keyboardType="number-pad"
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      {fieldErrors.duration_minutes ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.duration_minutes.join(", ")}
        </Text>
      ) : null}

      <Text style={{ fontSize: 18 }}>Services</Text>

      {services.map((service) => {
        const isSelected = selectedServiceIds.includes(service.id);

        return (
          <Button
            key={service.id}
            title={`${isSelected ? "✓ " : ""}${service.title} — $${service.price} — ${service.duration_minutes} min`}
            onPress={() => {
              setSelectedServiceIds((currentIds) =>
                isSelected
                  ? currentIds.filter((id) => id !== service.id)
                  : [...currentIds, service.id]
              );
            }}
          />
        );
      })}

      {fieldErrors.services ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.services.join(", ")}
        </Text>
      ) : null}

      {fieldErrors.service_ids ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.service_ids.join(", ")}
        </Text>
      ) : null}

      {error ? (
        <Text style={{ color: "red" }}>
          {error}
        </Text>
      ) : null}

      <Button
        title={
          isSaving
            ? "Saving..."
            : "Create Appointment"
        }
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </View>
  );
}