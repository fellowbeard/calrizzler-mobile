import { Text, TextInput, View } from "react-native";

import { isValidEmail } from "@/utils/formValidation";

type ValidatedEmailInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export function ValidatedEmailInput({
  value,
  onChangeText,
  label = "Email",
  placeholder = "Email",
}: ValidatedEmailInputProps) {
  const hasValue = value.trim().length > 0;
  const isInvalid = hasValue && !isValidEmail(value);

  return (
    <View style={{ gap: 6 }}>
      <Text>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: isInvalid ? "red" : "#999",
          borderRadius: 8,
          padding: 12,
        }}
      />

      {isInvalid && (
        <Text style={{ color: "red", fontSize: 12 }}>
          Enter a valid email address.
        </Text>
      )}
    </View>
  );
}
