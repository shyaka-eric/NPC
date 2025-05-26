export type UserRole = 'unit-leader' | 'admin' | 'logistics-officer' | 'system-admin';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  
  phoneNumber?: string;
  profileImage?: string;
  rank?: string;
  unit?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type ItemStatus = 'in-stock' | 'in-use' | 'under-repair' | 'damaged';

export interface Item {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiration_date?: Date;
  last_updated: Date;
  status: ItemStatus;
  assigned_quantity?: number;
  assignedTo?: string;
}

export interface IssuedItem {
  id: string;
  item: string;
  item_name: string;
  item_category: string;
  assigned_to: string;
  assigned_to_name: string;
  assigned_date: string;
  serial_number: string;
  expiration_date?: string;
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
  requested_by?: string;
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
  created_at?: string;
  updated_at?: string;
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