export interface NotificationModel {
  id: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  notification_type: string;
  request?: string;
  user: string;
}

export class Notification {
  private model: NotificationModel;

  constructor(data: Omit<NotificationModel, 'id' | 'created_at' | 'is_read'>) {
    this.model = {
      ...data,
      id: this.generateId(),
      is_read: false,
      created_at: new Date(),
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
    return this.model.user;
  }

  getTitle(): string {
    return this.model.notification_type;
  }

  getMessage(): string {
    return this.model.message;
  }

  getType(): string {
    return this.model.notification_type;
  }

  isRead(): boolean {
    return this.model.is_read;
  }

  getCreatedAt(): Date {
    return this.model.created_at;
  }

  getUpdatedAt(): Date {
    return this.model.created_at;
  }

  getActionUrl(): string | undefined {
    return this.model.request;
  }

  getMetadata(): Record<string, any> | undefined {
    return undefined;
  }

  // Setters
  setTitle(title: string): void {
    this.model.notification_type = title;
  }

  setMessage(message: string): void {
    this.model.message = message;
  }

  setType(type: string): void {
    this.model.notification_type = type;
  }

  setRead(read: boolean): void {
    this.model.is_read = read;
  }

  setActionUrl(url: string): void {
    this.model.request = url;
  }

  setMetadata(metadata: Record<string, any>): void {
    // No metadata to set
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
      message: data.message,
      notification_type: data.notification_type,
      request: data.request,
      user: data.user,
    });
    notification.model.id = data.id;
    notification.model.is_read = data.is_read;
    notification.model.created_at = data.created_at;
    return notification;
  }
}