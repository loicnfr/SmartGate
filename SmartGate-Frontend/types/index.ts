export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  faceEncoding?: string;
  department?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  checkIn?: string;
  checkOut?: string;
  date: string;
  status: 'present' | 'absent' | 'partial';
  workingHours?: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  recognizeUser: (imageData: string) => Promise<User | null>;
}

export interface FaceRecognitionResponse {
  success: boolean;
  user?: User;
  token?: string;
  message: string;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
  method: 'face-recognition' | 'manual';
}
