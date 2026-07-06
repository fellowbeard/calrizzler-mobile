import { Text, View } from "react-native";

type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <View style={{ padding: 24 }}>
      <Text>{message}</Text>
    </View>
  );
}