export type UserRole = 'unit-leader' | 'admin' | 'logistics-officer' | 'system-admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type ItemStatus = 'in-stock' | 'in-use' | 'under-repair' | 'damaged';

export interface Item {
  id: string;
  serial_number: string;
  name: string;
  category: string;
  quantity: number;
  expiration_date?: Date;
  last_updated: Date;
}

export type RequestStatus = 'pending' | 'approved' | 'denied' | 'issued' | 'completed';
export type RequestType = 'new' | 'repair';

export interface Request {
  id: string;
  type: RequestType;
  itemId: string;
  itemName: string;
  quantity: number;
  requestedBy: string;
  requestedByName: string;
  requestedAt: Date;
  status: RequestStatus;
  approvedBy?: string;
  approvedAt?: Date;
  issuedBy?: string;
  issuedAt?: Date;
  deniedBy?: string;
  deniedAt?: Date;
  reason?: string;
  attachments?: string[];
  priority?: string;
  purpose?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export interface Log {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface ReportOptions {
  type: 'stock-levels' | 'request-trends' | 'user-activity' | 'item-popularity' | 'repair-frequency';
  startDate: Date;
  endDate: Date;
  format?: 'chart' | 'pdf' | 'excel';
}