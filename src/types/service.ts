export type Service = {
  id: number;
  user_id: number;
  title: string;
  price: string | number;
  duration_minutes: number;
  description: string | null;
};