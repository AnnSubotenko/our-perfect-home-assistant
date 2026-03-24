export type Bill = {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  dueDate?: string;
  category?: string;
};
