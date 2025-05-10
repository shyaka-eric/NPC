import { RequestStatus, RequestType } from '../types';

export interface RequestModel {
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
  repairDetails?: RepairDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepairDetails {
  description: string;
  photoUrl?: string;
  estimatedCost?: number;
  repairStatus?: 'pending' | 'in-progress' | 'completed' | 'failed';
  completedAt?: Date;
  completedBy?: string;
}

export class Request {
  private model: RequestModel;

  constructor(data: Omit<RequestModel, 'id' | 'createdAt' | 'updatedAt'>) {
    this.model = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Getters
  getId(): string {
    return this.model.id;
  }

  getType(): RequestType {
    return this.model.type;
  }

  getItemId(): string {
    return this.model.itemId;
  }

  getItemName(): string {
    return this.model.itemName;
  }

  getQuantity(): number {
    return this.model.quantity;
  }

  getRequestedBy(): string {
    return this.model.requestedBy;
  }

  getRequestedByName(): string {
    return this.model.requestedByName;
  }

  getRequestedAt(): Date {
    return this.model.requestedAt;
  }

  getStatus(): RequestStatus {
    return this.model.status;
  }

  getApprovedBy(): string | undefined {
    return this.model.approvedBy;
  }

  getApprovedAt(): Date | undefined {
    return this.model.approvedAt;
  }

  getIssuedBy(): string | undefined {
    return this.model.issuedBy;
  }

  getIssuedAt(): Date | undefined {
    return this.model.issuedAt;
  }

  getDeniedBy(): string | undefined {
    return this.model.deniedBy;
  }

  getDeniedAt(): Date | undefined {
    return this.model.deniedAt;
  }

  getReason(): string | undefined {
    return this.model.reason;
  }

  getAttachments(): string[] {
    return this.model.attachments || [];
  }

  getRepairDetails(): RepairDetails | undefined {
    return this.model.repairDetails;
  }

  getCreatedAt(): Date {
    return this.model.createdAt;
  }

  getUpdatedAt(): Date {
    return this.model.updatedAt;
  }

  // Setters
  setStatus(status: RequestStatus): void {
    this.model.status = status;
    this.model.updatedAt = new Date();
  }

  setApprovedBy(userId: string): void {
    this.model.approvedBy = userId;
    this.model.approvedAt = new Date();
    this.model.status = 'approved';
    this.model.updatedAt = new Date();
  }

  setIssuedBy(userId: string): void {
    this.model.issuedBy = userId;
    this.model.issuedAt = new Date();
    this.model.status = 'issued';
    this.model.updatedAt = new Date();
  }

  setDeniedBy(userId: string, reason: string): void {
    this.model.deniedBy = userId;
    this.model.deniedAt = new Date();
    this.model.reason = reason;
    this.model.status = 'denied';
    this.model.updatedAt = new Date();
  }

  setReason(reason: string): void {
    this.model.reason = reason;
    this.model.updatedAt = new Date();
  }

  addAttachment(url: string): void {
    this.model.attachments = [...(this.model.attachments || []), url];
    this.model.updatedAt = new Date();
  }

  setRepairDetails(details: RepairDetails): void {
    this.model.repairDetails = details;
    this.model.updatedAt = new Date();
  }

  // Methods
  isApproved(): boolean {
    return this.model.status === 'approved';
  }

  isIssued(): boolean {
    return this.model.status === 'issued';
  }

  isDenied(): boolean {
    return this.model.status === 'denied';
  }

  isPending(): boolean {
    return this.model.status === 'pending';
  }

  // Convert to plain object
  toJSON(): RequestModel {
    return { ...this.model };
  }

  // Create from plain object
  static fromJSON(data: RequestModel): Request {
    const request = new Request({
      type: data.type,
      itemId: data.itemId,
      itemName: data.itemName,
      quantity: data.quantity,
      requestedBy: data.requestedBy,
      requestedByName: data.requestedByName,
      requestedAt: data.requestedAt,
      status: data.status,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      issuedBy: data.issuedBy,
      issuedAt: data.issuedAt,
      deniedBy: data.deniedBy,
      deniedAt: data.deniedAt,
      reason: data.reason,
      attachments: data.attachments,
      repairDetails: data.repairDetails,
    });
    request.model.id = data.id;
    request.model.createdAt = data.createdAt;
    request.model.updatedAt = data.updatedAt;
    return request;
  }
} 