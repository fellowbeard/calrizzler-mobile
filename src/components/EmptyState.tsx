import { Text, View } from "react-native";

type EmptyStateProps = {
  message: string;
};

export function EmptyState({
  message,
}: EmptyStateProps) {
  return (
    <View style={{ padding: 24 }}>
      <Text>{message}</Text>
    </View>
  );
}