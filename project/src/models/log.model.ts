export interface LogModel {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class Log {
  private model: LogModel;

  constructor(data: Omit<LogModel, 'id' | 'timestamp'>) {
    this.model = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
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

  getUserName(): string {
    return this.model.userName;
  }

  getAction(): string {
    return this.model.action;
  }

  getDetails(): string {
    return this.model.details;
  }

  getTimestamp(): Date {
    return this.model.timestamp;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.model.metadata;
  }

  getIpAddress(): string | undefined {
    return this.model.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.model.userAgent;
  }

  // Setters
  setAction(action: string): void {
    this.model.action = action;
  }

  setDetails(details: string): void {
    this.model.details = details;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.model.metadata = metadata;
  }

  setIpAddress(ipAddress: string): void {
    this.model.ipAddress = ipAddress;
  }

  setUserAgent(userAgent: string): void {
    this.model.userAgent = userAgent;
  }

  // Convert to plain object
  toJSON(): LogModel {
    return { ...this.model };
  }

  // Create from plain object
  static fromJSON(data: LogModel): Log {
    const log = new Log({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      details: data.details,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
    log.model.id = data.id;
    log.model.timestamp = data.timestamp;
    return log;
  }
} 