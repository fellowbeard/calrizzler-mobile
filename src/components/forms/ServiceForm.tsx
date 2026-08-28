import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { formatDuration } from "@/utils/durationFormatting";

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

export type ServiceFormValues = {
  title: string;
  price: string;
  duration_minutes: string;
  description: string;
};

type ServiceFormInitialValues = {
  title?: string | null;
  price?: string | number | null;
  duration_minutes?: string | number;
  description?: string | null;
};

type ServiceFormProps = {
  initialValues?: ServiceFormInitialValues;
  submitLabel: string;
  isSaving: boolean;
  error?: string;
  onSubmit: (values: ServiceFormValues) => void;
};

export function ServiceForm({
  initialValues,
  submitLabel,
  isSaving,
  error,
  onSubmit,
}: ServiceFormProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!initialValues) return;

    setTitle(initialValues.title || "");
    setPrice(String(initialValues.price ?? ""));

    const initialDuration = Number(initialValues.duration_minutes ?? 0);

    setDurationHours(Math.floor(initialDuration / 60));
    setDurationMinutes(initialDuration % 60);

    setDescription(initialValues.description || "");
  }, [initialValues]);

  const totalDurationMinutes = durationHours * 60 + durationMinutes;

  function handleSubmit() {
    onSubmit({
      title,
      price,
      duration_minutes: String(totalDurationMinutes),
      description,
    });
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text>Title</Text>

        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={{
            borderWidth: 1,
            padding: 12,
            borderRadius: 8,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Price</Text>

        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          style={{
            borderWidth: 1,
            padding: 12,
            borderRadius: 8,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Duration</Text>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <Text>Hours</Text>

            <View
              style={{
                borderWidth: 1,
                borderRadius: 8,
              }}
            >
              <Picker
                selectedValue={durationHours}
                onValueChange={(value) => setDurationHours(Number(value))}
              >
                {HOUR_OPTIONS.map((hour) => (
                  <Picker.Item key={hour} label={String(hour)} value={hour} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ flex: 1, gap: 6 }}>
            <Text>Minutes</Text>

            <View
              style={{
                borderWidth: 1,
                borderRadius: 8,
              }}
            >
              <Picker
                selectedValue={durationMinutes}
                onValueChange={(value) => setDurationMinutes(Number(value))}
              >
                {MINUTE_OPTIONS.map((minute) => (
                  <Picker.Item
                    key={minute}
                    label={String(minute)}
                    value={minute}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {totalDurationMinutes > 0 ? (
          <Text>Duration: {formatDuration(totalDurationMinutes)}</Text>
        ) : (
          <Text style={{ color: "red" }}>
            Duration must be greater than 0 minutes.
          </Text>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Text>Description</Text>

        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{
            borderWidth: 1,
            padding: 12,
            borderRadius: 8,
            minHeight: 100,
            textAlignVertical: "top",
          }}
        />
      </View>

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      <Button
        title={isSaving ? "Saving..." : submitLabel}
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </View>
  );
}
