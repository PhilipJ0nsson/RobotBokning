export interface Document {
    id: number;
    title: string;
    description: string;
    filePath: string;
    uploadDate: string;
  }
  
  export interface Robot {
    id: number;
    name: string;
    isAvailable: boolean;
    description: string;
    nextAvailableTime?: string;
    documents: Document[];
  }

  
  export interface CreateBookingRequest {
      robotId: number;
      startTime: string;
      endTime: string;
  }
  
  export interface Booking {
      id: number;
      userId: string;
      robotId: number;
      date: string;
      startTime: string;
      endTime: string;
      robotName?: string;
      status: 'Scheduled' | 'Completed' | 'Cancelled';
      user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        company: string;
  };
}

  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
    token?: string;
    isAdmin: boolean;
    bookings?: Booking[];
  }
  
  export interface AuthContextType {
    user: User | null;
    loading: boolean;
  }

  
  export interface BookingDto {
    id: number;
    robotId: number;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    userId: string;
  }
  
  // Enums
  export enum BookingStatus
  {
      Scheduled = 0,
      InProgress = 1,
      Cancelled = 2
  }
  
  // Extended interfaces for the UI
  export interface BookingWithDetails extends BookingDto {
    robotName?: string;
    user?: User;
  }
  
  export interface BookingsByUser {
    user: User;
    bookings: BookingWithDetails[];
  }

  export type DocumentType = 'pdf' | 'image' | 'text';

  export interface DocumentForm {
    title: string;
    description: string;
    type: DocumentType;
    file: File | null;
  }


  
  export interface RobotFormData {
    name: string;
    description: string;
    isAvailable: boolean;
  }

  export interface HolderInfo {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string; // Lägg till detta
    holdingPeriod: {
      start: string;
      end: string;
    };
  }
  
  export interface NextBookingInfo {
    firstName: string;
    lastName: string;
    company: string;
    phone: string;
    startTime: string;
    endTime: string;
    description: string;
    status: string;
  }
  export interface CurrentHolder {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    phone: string;
    startTime: string;
    endTime: string;
    token: string;
    isAdmin: boolean;
}

export interface NextBooking {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  startTime: string;
  endTime: string;
  description: string;
  status: string;
}