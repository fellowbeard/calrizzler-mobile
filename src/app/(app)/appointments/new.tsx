import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useClients } from "@/hooks/useClients";
import { useCreateAppointment } from "@/hooks/useCreateAppointment";
import { useCreateClient } from "@/hooks/useCreateClient";
import { useResources } from "@/hooks/useResources";
import { useServices } from "@/hooks/useServices";

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const { clients } = useClients();
  const { resources } = useResources();
  const { services } = useServices();

  const {
    createAppointment,
    error: appointmentError,
    fieldErrors,
    isSaving: isSavingAppointment,
  } = useCreateAppointment();

  const {
    createClient,
    error: clientError,
    isSaving: isSavingClient,
  } = useCreateClient();

  const [clientId, setClientId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const isNewClient = clientId === "new";
  const isSaving = isSavingAppointment || isSavingClient;

  if (!canWrite(user)) {
    return <Redirect href="/appointments" />;
  }

  async function handleSubmit() {
    let selectedClientId = Number(clientId);

    if (isNewClient) {
      const createdClient = await createClient(newClient);

      if (!createdClient) {
        return;
      }

      selectedClientId = createdClient.id;
    }

    const appointment = await createAppointment({
      client_id: selectedClientId,
      resource_id: resourceId ? Number(resourceId) : null,
      scheduled_at: scheduledAt.toISOString(),
      status: "scheduled",
      duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      service_ids: selectedServiceIds,
    });

    if (appointment) {
      router.replace(`/appointments/${appointment.id}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Appointment</Text>

      <Text style={{ fontSize: 18 }}>Client</Text>

      <Picker
        selectedValue={clientId}
        onValueChange={(value) => setClientId(String(value))}
      >
        <Picker.Item label="Select a client..." value="" />
        <Picker.Item label="+ New Client" value="new" />

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

      {isNewClient && (
        <>
          <Text style={{ fontSize: 18 }}>New Client Info</Text>

          <TextInput
            placeholder="First name"
            value={newClient.first_name}
            onChangeText={(value) =>
              setNewClient({ ...newClient, first_name: value })
            }
            style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
          />

          <TextInput
            placeholder="Last name"
            value={newClient.last_name}
            onChangeText={(value) =>
              setNewClient({ ...newClient, last_name: value })
            }
            style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
          />

          <TextInput
            placeholder="Email"
            value={newClient.email}
            onChangeText={(value) =>
              setNewClient({ ...newClient, email: value })
            }
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
          />

          <TextInput
            placeholder="Phone"
            value={newClient.phone}
            onChangeText={(value) =>
              setNewClient({ ...newClient, phone: value })
            }
            keyboardType="phone-pad"
            style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
          />
        </>
      )}

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

      <Text style={{ fontSize: 18 }}>Appointment Time</Text>

      <Button
        title={scheduledAt.toLocaleString()}
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

      <TextInput
        placeholder="Duration override minutes optional"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        keyboardType="number-pad"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      {fieldErrors.duration_minutes ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.duration_minutes.join(", ")}
        </Text>
      ) : null}

      {fieldErrors.base ? (
        <Text style={{ color: "red" }}>
          {fieldErrors.base.join(", ")}
        </Text>
      ) : null}

      {clientError ? (
        <Text style={{ color: "red" }}>{clientError}</Text>
      ) : null}

      {appointmentError ? (
        <Text style={{ color: "red" }}>{appointmentError}</Text>
      ) : null}

      <Button
        title={isSaving ? "Saving..." : "Create Appointment"}
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </ScrollView>
  );
}