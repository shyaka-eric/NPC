import { UserRole } from '../types';

export interface UserModel {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string; // Hashed password
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
}

export class User {
  private model: UserModel;

  constructor(data: Omit<UserModel, 'id' | 'createdAt' | 'updatedAt'>) {
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

  getName(): string {
    return this.model.name;
  }

  getEmail(): string {
    return this.model.email;
  }

  getRole(): UserRole {
    return this.model.role;
  }

  getDepartment(): string | undefined {
    return this.model.department;
  }

  getPhoneNumber(): string | undefined {
    return this.model.phoneNumber;
  }

  getProfileImage(): string | undefined {
    return this.model.profileImage;
  }

  getCreatedAt(): Date {
    return this.model.createdAt;
  }

  getUpdatedAt(): Date {
    return this.model.updatedAt;
  }

  isActive(): boolean {
    return this.model.isActive;
  }

  getLastLogin(): Date | undefined {
    return this.model.lastLogin;
  }

  // Setters
  setName(name: string): void {
    this.model.name = name;
    this.model.updatedAt = new Date();
  }

  setEmail(email: string): void {
    this.model.email = email;
    this.model.updatedAt = new Date();
  }

  setPassword(password: string): void {
    this.model.password = password;
    this.model.updatedAt = new Date();
  }

  setRole(role: UserRole): void {
    this.model.role = role;
    this.model.updatedAt = new Date();
  }

  setDepartment(department: string): void {
    this.model.department = department;
    this.model.updatedAt = new Date();
  }

  setPhoneNumber(phoneNumber: string): void {
    this.model.phoneNumber = phoneNumber;
    this.model.updatedAt = new Date();
  }

  setProfileImage(profileImage: string): void {
    this.model.profileImage = profileImage;
    this.model.updatedAt = new Date();
  }

  setActive(active: boolean): void {
    this.model.isActive = active;
    this.model.updatedAt = new Date();
  }

  updateLastLogin(): void {
    this.model.lastLogin = new Date();
    this.model.updatedAt = new Date();
  }

  // Convert to plain object
  toJSON(): UserModel {
    return { ...this.model };
  }

  // Create from plain object
  static fromJSON(data: UserModel): User {
    const user = new User({
      username: data.username,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      department: data.department,
      phoneNumber: data.phoneNumber,
      profileImage: data.profileImage,
      isActive: data.isActive,
    });
    user.model.id = data.id;
    user.model.createdAt = data.createdAt;
    user.model.updatedAt = data.updatedAt;
    user.model.lastLogin = data.lastLogin;
    return user;
  }
}