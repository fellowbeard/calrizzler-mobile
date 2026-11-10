import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { apiFetch } from "@/api/client";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

import type { Client } from "@/types/client";
import type { Appointment } from "@/types/appointment";
import type { Service } from "@/types/service";

type SearchResults = {
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
};

type AppointmentStatus = "" | "scheduled" | "completed" | "canceled";

const EMPTY_RESULTS: SearchResults = {
  clients: [],
  appointments: [],
  services: [],
};

const STATUSES: { label: string; value: AppointmentStatus }[] = [
  { label: "All", value: "" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Canceled", value: "canceled" },
];

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export default function SearchScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [date, setDate] = useState("");
  const [pendingDate, setPendingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [status, setStatus] = useState<AppointmentStatus>("");

  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasFilters = Boolean(date || status);
  const hasSearch = Boolean(search.trim() || hasFilters);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const query = debouncedSearch.trim();

    // Wait until the text debounce catches up.
    if (search.trim() !== query) {
      return;
    }

    if (!query && !date && !status) {
      return;
    }

    const params = new URLSearchParams();

    if (query) params.append("q", query);
    if (date) params.append("date", date);
    if (status) params.append("status", status);

    let active = true;

    apiFetch<SearchResults>(`/api/v1/search?${params.toString()}`)
      .then((data) => {
        if (!active) return;

        setResults(data);
        setError("");
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;

        setResults(EMPTY_RESULTS);
        setError(err instanceof Error ? err.message : "Unable to search.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, search, date, status]);

  function updateSearch(value: string) {
    setSearch(value);
    setError("");

    const shouldSearch = Boolean(value.trim() || date || status);
    setIsLoading(shouldSearch);

    if (!shouldSearch) {
      setResults(EMPTY_RESULTS);
    }
  }

  function updateDate(value: string) {
    setDate(value);
    setError("");

    const shouldSearch = Boolean(search.trim() || value || status);
    setIsLoading(shouldSearch);

    if (!shouldSearch) {
      setResults(EMPTY_RESULTS);
    }
  }

  function updateStatus(value: AppointmentStatus) {
    setStatus(value);
    setError("");

    const shouldSearch = Boolean(search.trim() || date || value);
    setIsLoading(shouldSearch);

    if (!shouldSearch) {
      setResults(EMPTY_RESULTS);
    }
  }

  function openDatePicker() {
    setPendingDate(parseLocalDate(date));
    setShowDatePicker(true);
  }

  function applyDate() {
    updateDate(formatLocalDate(pendingDate));
    setShowDatePicker(false);
  }

  function clearSearch() {
    setSearch("");
    setDebouncedSearch("");
    setDate("");
    setPendingDate(new Date());
    setShowDatePicker(false);
    setStatus("");
    setResults(EMPTY_RESULTS);
    setError("");
    setIsLoading(false);
  }

  const hasResults =
    results.clients.length > 0 ||
    results.appointments.length > 0 ||
    results.services.length > 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 20,
        }}
      >
        Search
      </Text>

      {/* Universal search */}

      <TextInput
        value={search}
        onChangeText={updateSearch}
        placeholder="Search clients, appointments, services"
        accessibilityLabel="Universal search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={{
          borderWidth: 1,
          borderColor: "#0D0D5B",
          borderRadius: 8,
          padding: 12,
          backgroundColor: "#F5F5F0",
          color: "#000000",
          marginBottom: 20,
        }}
      />

      {/* Appointment date */}

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 8,
        }}
      >
        Appointment date
      </Text>

      <Pressable
        onPress={openDatePicker}
        accessibilityRole="button"
        accessibilityLabel="Choose appointment date"
        style={{
          borderWidth: 1,
          borderColor: "#0D0D5B",
          borderRadius: 8,
          padding: 14,
          backgroundColor: "#F5F5F0",
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#000000" }}>{date || "Choose a date"}</Text>
      </Pressable>

      {showDatePicker && (
        <View style={{ marginBottom: 20 }}>
          <DateTimePicker
            value={pendingDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);

                if (event.type === "set" && selected) {
                  updateDate(formatLocalDate(selected));
                }

                return;
              }

              if (selected) {
                setPendingDate(selected);
              }
            }}
          />

          {Platform.OS === "ios" && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Pressable
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
                style={{ padding: 12 }}
              >
                <Text
                  style={{
                    color: "#0D0D5B",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={applyDate}
                accessibilityRole="button"
                style={{ padding: 12 }}
              >
                <Text
                  style={{
                    color: "#0D0D5B",
                    fontWeight: "600",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Appointment status */}

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          marginBottom: 10,
        }}
      >
        Appointment status
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {STATUSES.map((option) => {
          const selected = status === option.value;

          return (
            <Pressable
              key={option.label}
              onPress={() => updateStatus(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#0D0D5B",
                backgroundColor: selected ? "#0D0D5B" : "#F5F5F0",
              }}
            >
              <Text
                style={{
                  color: selected ? "#FFFFFF" : "#0D0D5B",
                  fontWeight: "600",
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Clear filters */}

      {hasSearch && (
        <Pressable
          onPress={clearSearch}
          accessibilityRole="button"
          style={{
            alignSelf: "flex-start",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: "#0D0D5B",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: "#0D0D5B",
              fontWeight: "600",
            }}
          >
            Clear
          </Text>
        </Pressable>
      )}

      {/* Search results */}

      {!hasSearch ? (
        <Text>Search your clients, appointments, and services.</Text>
      ) : isLoading ? (
        <LoadingState message="Searching..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : !hasResults ? (
        <Text>
          {hasFilters ? "No appointments found." : "No results found."}
        </Text>
      ) : (
        <>
          {/* Clients */}

          {results.clients.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                }}
              >
                Clients
              </Text>

              {results.clients.map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => router.push(`/clients/${client.id}`)}
                  accessibilityRole="button"
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                  }}
                >
                  <Text>
                    {client.first_name} {client.last_name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Appointments */}

          {results.appointments.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                }}
              >
                Appointments
              </Text>

              {results.appointments.map((appointment) => (
                <Pressable
                  key={appointment.id}
                  onPress={() => router.push(`/appointments/${appointment.id}`)}
                  accessibilityRole="button"
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                  }}
                >
                  <Text>
                    {appointment.client
                      ? `${appointment.client.first_name} ${appointment.client.last_name}`
                      : "Appointment"}
                  </Text>

                  <Text>{appointment.status}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Services */}

          {results.services.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                }}
              >
                Services
              </Text>

              {results.services.map((service) => (
                <Pressable
                  key={service.id}
                  onPress={() => router.push(`/services/${service.id}`)}
                  accessibilityRole="button"
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                  }}
                >
                  <Text>{service.title}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
