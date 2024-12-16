export interface Booking {
    id: number;
    userId: string;
    startTime: string;
    endTime: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
  }
  
  export interface CreateBookingDto {
    startTime: string;
    endTime: string;
  }