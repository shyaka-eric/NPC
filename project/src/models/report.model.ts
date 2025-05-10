export interface ReportModel {
  id: string;
  type: 'stock-levels' | 'request-trends' | 'user-activity' | 'item-popularity' | 'repair-frequency';
  startDate: Date;
  endDate: Date;
  generatedBy: string;
  generatedAt: Date;
  data: ReportData;
  format: 'chart' | 'pdf' | 'excel';
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  downloadUrl?: string;
}

export interface ReportData {
  summary: Record<string, any>;
  details: any[];
  charts?: {
    type: string;
    data: any;
    options?: any;
  }[];
}

export class Report {
  private model: ReportModel;

  constructor(data: Omit<ReportModel, 'id' | 'generatedAt' | 'status'>) {
    this.model = {
      ...data,
      id: this.generateId(),
      generatedAt: new Date(),
      status: 'pending',
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Getters
  getId(): string {
    return this.model.id;
  }

  getType(): string {
    return this.model.type;
  }

  getStartDate(): Date {
    return this.model.startDate;
  }

  getEndDate(): Date {
    return this.model.endDate;
  }

  getGeneratedBy(): string {
    return this.model.generatedBy;
  }

  getGeneratedAt(): Date {
    return this.model.generatedAt;
  }

  getData(): ReportData {
    return this.model.data;
  }

  getFormat(): 'chart' | 'pdf' | 'excel' {
    return this.model.format;
  }

  getStatus(): 'pending' | 'completed' | 'failed' {
    return this.model.status;
  }

  getError(): string | undefined {
    return this.model.error;
  }

  getDownloadUrl(): string | undefined {
    return this.model.downloadUrl;
  }

  // Setters
  setData(data: ReportData): void {
    this.model.data = data;
  }

  setStatus(status: 'pending' | 'completed' | 'failed'): void {
    this.model.status = status;
  }

  setError(error: string): void {
    this.model.error = error;
    this.model.status = 'failed';
  }

  setDownloadUrl(url: string): void {
    this.model.downloadUrl = url;
    this.model.status = 'completed';
  }

  // Methods
  isPending(): boolean {
    return this.model.status === 'pending';
  }

  isCompleted(): boolean {
    return this.model.status === 'completed';
  }

  isFailed(): boolean {
    return this.model.status === 'failed';
  }

  // Convert to plain object
  toJSON(): ReportModel {
    return { ...this.model };
  }

  // Create from plain object
  static fromJSON(data: ReportModel): Report {
    const report = new Report({
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      generatedBy: data.generatedBy,
      data: data.data,
      format: data.format,
    });
    report.model.id = data.id;
    report.model.generatedAt = data.generatedAt;
    report.model.status = data.status;
    report.model.error = data.error;
    report.model.downloadUrl = data.downloadUrl;
    return report;
  }
} 