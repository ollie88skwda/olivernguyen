export interface User {
  id: string;
  name: string;
  password: string;
}

export interface Debt {
  id: string;
  amount: number;
  description: string;
  date: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "active" | "paid";
  photo?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "debt_request" | "debt_confirmed" | "debt_paid" | "payment_received";
  debtId?: string;
  read: boolean;
  createdAt: string;
}
