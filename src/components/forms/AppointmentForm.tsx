import { useEffect, useRef, useState } from "react";
import {
  Button,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { fetchAvailability } from "@/api/availability";
import type { ValidationDetails } from "@/api/client";
import type { Appointment } from "@/types/appointment";
import type { Client } from "@/types/client";
import type { Resource } from "@/types/resource";
import type { Service } from "@/types/service";

import {
  appointmentToPickerDate,
  currentTimeForPicker,
  formatPickerDateTime,
  formatTime,
  pickerDateToScheduledAt,
} from "@/utils/dateFormatting";
import { formatDuration } from "@/utils/durationFormatting";

export type AppointmentFormValues = {
  client_id: number | null;
  resource_id: number | null;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  duration_overridden: boolean;
  service_ids: number[];
};

type AppointmentFormProps = {
  timezone: string;
  initialValues?: Appointment | null;
  initialClientId?: string;
  clients: Client[];
  resources: Resource[];
  services: Service[];
  submitLabel: string;
  isSaving: boolean;
  fieldErrors?: ValidationDetails;
  error?: string;
  onNewClient: () => void;
  onSubmit: (values: AppointmentFormValues) => void | Promise<void>;
};

export function AppointmentForm({
  timezone,
  initialValues,
  initialClientId = "",
  clients,
  resources,
  services,
  submitLabel,
  isSaving,
  error,
  fieldErrors = {},
  onNewClient,
  onSubmit,
}: AppointmentFormProps) {
  const [clientId, setClientId] = useState(initialClientId);
  const [resourceId, setResourceId] = useState("");

  const [scheduledAt, setScheduledAt] = useState<Date>(() =>
    currentTimeForPicker(timezone)
  );

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState("scheduled");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [hasManualDurationOverride, setHasManualDurationOverride] =
    useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const resourceY = useRef(0);

  useEffect(() => {
    if (fieldErrors.resource?.length) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, resourceY.current - 12),
        animated: true,
      });
    }
  }, [fieldErrors]);

  useEffect(() => {
    setClientId(String(initialValues?.client_id ?? initialClientId ?? ""));
    setResourceId(String(initialValues?.resource_id ?? ""));

    setScheduledAt(
      initialValues?.scheduled_at
        ? appointmentToPickerDate(initialValues.scheduled_at, timezone)
        : currentTimeForPicker(timezone)
    );

    setStatus(initialValues?.status ?? "scheduled");

    setDurationMinutes(
      initialValues?.duration_minutes != null
        ? String(initialValues.duration_minutes)
        : ""
    );

    setHasManualDurationOverride(initialValues?.duration_overridden ?? false);

    setSelectedServiceIds(
      initialValues?.services?.map((service) => service.id) ?? []
    );
  }, [initialValues, initialClientId, timezone]);

  const date = [
    scheduledAt.getFullYear(),
    String(scheduledAt.getMonth() + 1).padStart(2, "0"),
    String(scheduledAt.getDate()).padStart(2, "0"),
  ].join("-");

  const duration = Number(durationMinutes);

  useEffect(() => {
    if (initialValues) return;

    setSelectedSlot("");
    setAvailableSlots([]);
    setAvailabilityError("");

    if (
      !resourceId ||
      !durationMinutes ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      setIsLoadingSlots(false);
      return;
    }

    let cancelled = false;

    setIsLoadingSlots(true);

    fetchAvailability({
      date,
      durationMinutes: duration,
      resourceId: Number(resourceId),
    })
      .then((slots) => {
        if (!cancelled) {
          setAvailableSlots(slots);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          console.error("Failed to fetch availability:", fetchError);
          setAvailableSlots([]);
          setAvailabilityError(
            "Could not load available times. Please try again."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialValues, date, resourceId, durationMinutes]);

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
    const parsedDuration =
      durationMinutes === "" ? null : Number(durationMinutes);

    if (
      !initialValues &&
      (!selectedSlot ||
        isLoadingSlots ||
        availabilityError ||
        !availableSlots.includes(selectedSlot))
    ) {
      return;
    }

    onSubmit({
      client_id: clientId ? Number(clientId) : null,
      resource_id: resourceId ? Number(resourceId) : null,
      scheduled_at: initialValues
        ? pickerDateToScheduledAt(scheduledAt)
        : pickerDateToScheduledAt(
            appointmentToPickerDate(selectedSlot, timezone)
          ),
      status,
      duration_minutes: parsedDuration,
      duration_overridden: hasManualDurationOverride,
      service_ids: selectedServiceIds,
    });
  }

  const serviceDurationTotal = calculateServiceDuration(selectedServiceIds);

  const needsAvailabilityInputs =
    !resourceId ||
    !durationMinutes ||
    !Number.isFinite(duration) ||
    duration <= 0;

  const cannotSubmitNewAppointment =
    !selectedSlot ||
    isLoadingSlots ||
    Boolean(availabilityError) ||
    !availableSlots.includes(selectedSlot);

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={{
        gap: 12,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
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

      {fieldErrors.client?.map((fieldError, index) => (
        <Text key={index}>{fieldError.message}</Text>
      ))}

      <View
        onLayout={(event: LayoutChangeEvent) => {
          resourceY.current = event.nativeEvent.layout.y;
        }}
      >
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

        {fieldErrors.resource?.map((fieldError, index) => (
          <Text key={index} style={{ color: "red" }}>
            Resource {fieldError.message}
          </Text>
        ))}
      </View>

      <Text>{initialValues ? "Scheduled At" : "Appointment Date"}</Text>

      <Button
        title={
          initialValues
            ? formatPickerDateTime(scheduledAt)
            : scheduledAt.toLocaleDateString("en-US")
        }
        onPress={() => setShowDatePicker(true)}
      />

      <Text>Business timezone: {timezone}</Text>

      {showDatePicker ? (
        <>
          <DateTimePicker
            value={scheduledAt}
            mode={initialValues ? "datetime" : "date"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);
              }

              if (event.type !== "dismissed" && selectedDate) {
                setScheduledAt(selectedDate);
              }
            }}
          />

          {Platform.OS === "ios" ? (
            <Button title="Done" onPress={() => setShowDatePicker(false)} />
          ) : null}
        </>
      ) : null}

      {fieldErrors.scheduled_at?.map((fieldError, index) => (
        <Text key={index}>{fieldError.message}</Text>
      ))}

      {initialValues ? (
        <>
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

          {fieldErrors.status?.map((fieldError, index) => (
            <Text key={index}>{fieldError.message}</Text>
          ))}
        </>
      ) : null}

      <Text>Total Appointment Duration</Text>

      <TextInput
        placeholder="Total time in minutes"
        value={durationMinutes}
        onChangeText={(value) => {
          setDurationMinutes(value.replace(/\D/g, ""));
          setHasManualDurationOverride(true);
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      {durationMinutes !== "" && duration >= 0 ? (
        <Text>Total time: {formatDuration(duration)}</Text>
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

      {fieldErrors.duration_minutes?.map((fieldError, index) => (
        <Text key={index}>{fieldError.message}</Text>
      ))}

      <Text>Services</Text>

      {services.map((service) => {
        const isSelected = selectedServiceIds.includes(service.id);

        return (
          <Button
            key={service.id}
            title={
              isSelected
                ? `✓ ${service.title} — ${formatDuration(
                    Number(service.duration_minutes)
                  )}`
                : `${service.title} — ${formatDuration(
                    Number(service.duration_minutes)
                  )}`
            }
            onPress={() => toggleService(service.id)}
            color={isSelected ? "#444" : undefined}
          />
        );
      })}

      {fieldErrors.services?.map((fieldError, index) => (
        <Text key={index}>{fieldError.message}</Text>
      ))}

      {!initialValues ? (
        <>
          <Text>Available Times</Text>

          {needsAvailabilityInputs ? (
            <Text>Select a resource and services to see available times.</Text>
          ) : isLoadingSlots ? (
            <Text>Loading available times...</Text>
          ) : availabilityError ? (
            <Text style={{ color: "red" }}>{availabilityError}</Text>
          ) : availableSlots.length === 0 ? (
            <Text>No available times for this date.</Text>
          ) : (
            <View style={{ borderWidth: 1, borderRadius: 8 }}>
              <Picker
                selectedValue={selectedSlot}
                onValueChange={(value) => setSelectedSlot(String(value))}
              >
                <Picker.Item label="Select a time" value="" />

                {availableSlots.map((slot) => (
                  <Picker.Item
                    key={slot}
                    label={formatTime(slot, timezone)}
                    value={slot}
                  />
                ))}
              </Picker>
            </View>
          )}
        </>
      ) : null}

      {error &&
      (error !== "Validation failed." ||
        Object.keys(fieldErrors).length === 0) ? (
        <Text>{error}</Text>
      ) : null}

      <Button
        title={isSaving ? "Saving..." : submitLabel}
        onPress={handleSubmit}
        disabled={isSaving || (!initialValues && cannotSubmitNewAppointment)}
      />
    </ScrollView>
  );
}
