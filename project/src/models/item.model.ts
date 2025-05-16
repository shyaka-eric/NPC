import { ItemStatus } from '../types';

export type { ItemStatus } from '../types';

export interface ItemModel {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  status: ItemStatus;
  assignedTo?: string;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastIssuedAt?: Date;
  lastReturnedAt?: Date;
  repairHistory?: RepairRecord[];
  assigned_quantity?: number;
}

export interface RepairRecord {
  id: string;
  date: Date;
  description: string;
  cost?: number;
  status: 'completed' | 'in-progress' | 'failed';
  completedBy?: string;
}

export interface IssuedItemModel {
  id: string;
  item: string; // item id
  item_name: string; // Maps to 'name' from backend
  item_category: string; // Maps to 'category' from backend
  assigned_to: string;
  assigned_to_id?: string; // Add assigned_to_id to match backend response
  assigned_to_name: string;
  assigned_date: string;
  serial_number: string;
  expiration_date?: string;
  assigned_quantity?: number; // Add assigned_quantity to match backend response
}

export class Item {
  private model: ItemModel;

  constructor(data: Omit<ItemModel, 'id' | 'createdAt' | 'updatedAt' | 'repairHistory'>) {
    this.model = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      repairHistory: [],
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Getters
  getId(): string {
    return this.model.id;
  }

  getName(): string {
    return this.model.name;
  }

  getCategory(): string {
    return this.model.category;
  }

  getDescription(): string | undefined {
    return this.model.description;
  }

  getQuantity(): number {
    return this.model.quantity;
  }

  getStatus(): ItemStatus {
    return this.model.status;
  }

  getAssignedTo(): string | undefined {
    return this.model.assignedTo;
  }

  getExpirationDate(): Date | undefined {
    return this.model.expirationDate;
  }

  getCreatedAt(): Date {
    return this.model.createdAt;
  }

  getUpdatedAt(): Date {
    return this.model.updatedAt;
  }

  getLastIssuedAt(): Date | undefined {
    return this.model.lastIssuedAt;
  }

  getLastReturnedAt(): Date | undefined {
    return this.model.lastReturnedAt;
  }

  getRepairHistory(): RepairRecord[] {
    return this.model.repairHistory || [];
  }

  // Setters
  setName(name: string): void {
    this.model.name = name;
    this.model.updatedAt = new Date();
  }

  setCategory(category: string): void {
    this.model.category = category;
    this.model.updatedAt = new Date();
  }

  setDescription(description: string): void {
    this.model.description = description;
    this.model.updatedAt = new Date();
  }

  setQuantity(quantity: number): void {
    this.model.quantity = quantity;
    this.model.updatedAt = new Date();
  }

  setStatus(status: ItemStatus): void {
    this.model.status = status;
    this.model.updatedAt = new Date();
  }

  setAssignedTo(userId: string): void {
    this.model.assignedTo = userId;
    this.model.lastIssuedAt = new Date();
    this.model.updatedAt = new Date();
  }

  setExpirationDate(date: Date): void {
    this.model.expirationDate = date;
    this.model.updatedAt = new Date();
  }

  // Methods
  addToRepairHistory(record: Omit<RepairRecord, 'id'>): void {
    const newRecord: RepairRecord = {
      ...record,
      id: this.generateId(),
    };
    this.model.repairHistory = [...(this.model.repairHistory || []), newRecord];
    this.model.updatedAt = new Date();
  }

  removeAssignment(): void {
    this.model.assignedTo = undefined;
    this.model.lastReturnedAt = new Date();
    this.model.updatedAt = new Date();
  }

  isExpired(): boolean {
    if (!this.model.expirationDate) return false;
    return this.model.expirationDate < new Date();
  }

  // Convert to plain object
  toJSON(): ItemModel {
    return { ...this.model };
  }

  // Create from plain object
  static fromJSON(data: ItemModel): Item {
    const item = new Item({
      name: data.name,
      category: data.category,
      description: data.description,
      quantity: data.quantity,
      status: data.status,
      assignedTo: data.assignedTo,
      expirationDate: data.expirationDate,
    });
    item.model.id = data.id;
    item.model.createdAt = data.createdAt;
    item.model.updatedAt = data.updatedAt;
    item.model.lastIssuedAt = data.lastIssuedAt;
    item.model.lastReturnedAt = data.lastReturnedAt;
    item.model.repairHistory = data.repairHistory;
    return item;
  }
}