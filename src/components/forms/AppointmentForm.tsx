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
  notes: string;
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
  const [candidateSlots, setCandidateSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(() =>
    currentTimeForPicker(timezone)
  );

  const [status, setStatus] = useState("scheduled");
  const [notes, setNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [hasManualDurationOverride, setHasManualDurationOverride] =
    useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [serviceToAdd, setServiceToAdd] = useState("");

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
    setNotes(initialValues?.notes ?? "");

    setDurationMinutes(
      initialValues?.duration_minutes != null
        ? String(initialValues.duration_minutes)
        : ""
    );

    setHasManualDurationOverride(initialValues?.duration_overridden ?? false);

    setSelectedServiceIds(
      initialValues?.services?.map((service) => service.id) ?? []
    );
    setServiceToAdd("");
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
    setCandidateSlots([]);
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
      .then((result) => {
        if (!cancelled) {
          setAvailableSlots(result.slots);
          setCandidateSlots(result.candidate_slots);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          console.error("Failed to fetch availability:", fetchError);
          setAvailableSlots([]);
          setCandidateSlots([]);
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
  }, [initialValues, date, resourceId, durationMinutes, duration]);

  function calculateServiceDuration(serviceIds: number[]) {
    return services
      .filter((service) => serviceIds.includes(service.id))
      .reduce(
        (total, service) => total + Number(service.duration_minutes || 0),
        0
      );
  }

  function addService() {
    if (!serviceToAdd) return;

    const serviceId = Number(serviceToAdd);

    if (selectedServiceIds.includes(serviceId)) return;

    const updatedServiceIds = [...selectedServiceIds, serviceId];

    setSelectedServiceIds(updatedServiceIds);
    setServiceToAdd("");

    if (!hasManualDurationOverride) {
      const totalDuration = calculateServiceDuration(updatedServiceIds);
      setDurationMinutes(totalDuration > 0 ? String(totalDuration) : "");
    }
  }

  function removeService(serviceId: number) {
    const updatedServiceIds = selectedServiceIds.filter(
      (id) => id !== serviceId
    );

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

  function openDatePicker() {
    setPendingDate(new Date(scheduledAt));
    setShowDatePicker(true);
  }

  function applyDate() {
    setScheduledAt(pendingDate);
    setShowDatePicker(false);
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
      notes,
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

  const availableServices = services.filter(
    (service) => !selectedServiceIds.includes(service.id)
  );

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={{
        gap: 12,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Client */}

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

      {/* Services */}

      <Text>Services</Text>

      <View style={{ borderWidth: 1, borderRadius: 8 }}>
        <Picker
          testID="service-picker"
          selectedValue={serviceToAdd}
          onValueChange={(value) => setServiceToAdd(String(value))}
        >
          <Picker.Item label="Select a service" value="" />

          {availableServices.map((service) => (
            <Picker.Item
              key={service.id}
              label={`${service.title} — ${formatDuration(
                Number(service.duration_minutes)
              )}`}
              value={String(service.id)}
            />
          ))}
        </Picker>
      </View>

      <Button
        title="Add Service"
        onPress={addService}
        disabled={!serviceToAdd}
      />

      {selectedServiceIds.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: "600" }}>Selected Services</Text>

          {selectedServiceIds.map((serviceId) => {
            const service = services.find((item) => item.id === serviceId);

            if (!service) return null;

            return (
              <View
                key={serviceId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#DDDDDD",
                }}
              >
                <Text style={{ flex: 1 }}>
                  {service.title} —{" "}
                  {formatDuration(Number(service.duration_minutes))}
                </Text>

                <Button
                  title="Remove"
                  onPress={() => removeService(serviceId)}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      {fieldErrors.services?.map((fieldError, index) => (
        <Text key={index} style={{ color: "red" }}>
          {fieldError.message}
        </Text>
      ))}

      {/* Resource */}

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

      {/* Appointment date */}

      <Text>{initialValues ? "Scheduled At" : "Appointment Date"}</Text>

      <Button
        title={
          initialValues
            ? formatPickerDateTime(scheduledAt)
            : scheduledAt.toLocaleDateString("en-US")
        }
        onPress={openDatePicker}
      />

      <Text>Business timezone: {timezone}</Text>

      {showDatePicker ? (
        <View style={{ marginBottom: 12 }}>
          <DateTimePicker
            value={pendingDate}
            mode={initialValues ? "datetime" : "date"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);

                if (event.type === "set" && selectedDate) {
                  setScheduledAt(selectedDate);
                }

                return;
              }

              if (selectedDate) {
                setPendingDate(selectedDate);
              }
            }}
          />

          {Platform.OS === "ios" ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Button title="Cancel" onPress={() => setShowDatePicker(false)} />
              <Button title="Done" onPress={applyDate} />
            </View>
          ) : null}
        </View>
      ) : null}

      {fieldErrors.scheduled_at?.map((fieldError, index) => (
        <Text key={index}>{fieldError.message}</Text>
      ))}

      {/* Duration */}

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

      {/* Status for existing appointments */}

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

      {/* Available times for new appointments */}

      {!initialValues ? (
        <>
          <Text>Available Times</Text>

          {needsAvailabilityInputs ? (
            <Text>Select a resource and services to see available times.</Text>
          ) : isLoadingSlots ? (
            <Text>Loading available times...</Text>
          ) : availabilityError ? (
            <Text style={{ color: "red" }}>{availabilityError}</Text>
          ) : candidateSlots.length === 0 ? (
            <Text>No available times for this date.</Text>
          ) : (
            <View style={{ borderWidth: 1, borderRadius: 8 }}>
              <Picker
                selectedValue={selectedSlot}
                onValueChange={(value) => setSelectedSlot(String(value))}
              >
                <Picker.Item label="Select a time" value="" />

                {candidateSlots.map((slot) => {
                  const isAvailable = availableSlots.includes(slot);

                  return (
                    <Picker.Item
                      key={slot}
                      label={
                        isAvailable
                          ? formatTime(slot, timezone)
                          : `${formatTime(slot, timezone)} — Unavailable`
                      }
                      value={slot}
                      enabled={isAvailable}
                      color={isAvailable ? undefined : "#999999"}
                    />
                  );
                })}
              </Picker>
            </View>
          )}
        </>
      ) : null}

      {/* Notes */}

      <Text>Appointment Notes (Optional)</Text>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add notes specific to this appointment..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          minHeight: 100,
        }}
      />

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
