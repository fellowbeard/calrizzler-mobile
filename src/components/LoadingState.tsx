import { Text, View } from "react-native";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View style={{ padding: 24 }}>
      <Text>{message}</Text>
    </View>
  );
}