export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class Notification {
  private model: NotificationModel;

  constructor(data: Omit<NotificationModel, 'id' | 'createdAt' | 'updatedAt' | 'read'>) {
    this.model = {
      ...data,
      id: this.generateId(),
      read: false,
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

  getUserId(): string {
    return this.model.userId;
  }

  getTitle(): string {
    return this.model.title;
  }

  getMessage(): string {
    return this.model.message;
  }

  getType(): 'info' | 'success' | 'warning' | 'error' {
    return this.model.type;
  }

  isRead(): boolean {
    return this.model.read;
  }

  getCreatedAt(): Date {
    return this.model.createdAt;
  }

  getUpdatedAt(): Date {
    return this.model.updatedAt;
  }

  getActionUrl(): string | undefined {
    return this.model.actionUrl;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.model.metadata;
  }

  // Setters
  setTitle(title: string): void {
    this.model.title = title;
    this.model.updatedAt = new Date();
  }

  setMessage(message: string): void {
    this.model.message = message;
    this.model.updatedAt = new Date();
  }

  setType(type: 'info' | 'success' | 'warning' | 'error'): void {
    this.model.type = type;
    this.model.updatedAt = new Date();
  }

  setRead(read: boolean): void {
    this.model.read = read;
    this.model.updatedAt = new Date();
  }

  setActionUrl(url: string): void {
    this.model.actionUrl = url;
    this.model.updatedAt = new Date();
  }

  setMetadata(metadata: Record<string, any>): void {
    this.model.metadata = metadata;
    this.model.updatedAt = new Date();
  }

  // Methods
  markAsRead(): void {
    this.setRead(true);
  }

  markAsUnread(): void {
    this.setRead(false);
  }

  // Convert to plain object
  toJSON(): NotificationModel {
    return { ...this.model };
  }

  // Create from plain object
  static fromJSON(data: NotificationModel): Notification {
    const notification = new Notification({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
    });
    notification.model.id = data.id;
    notification.model.read = data.read;
    notification.model.createdAt = data.createdAt;
    notification.model.updatedAt = data.updatedAt;
    return notification;
  }
} 