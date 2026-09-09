// =============================================
// تعریف تمام تایپ‌های پروژه
// =============================================

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  date: string;         // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string | null;
  created_at: string;
}

export type AttendanceStatus = 'حاضر' | 'غایب' | 'تاخیر';

export interface Attendance {
  id: string;
  program_id: string;
  person_id: string;
  status: AttendanceStatus;
  check_in_time: string | null;   // ISO timestamp
  check_out_time: string | null;  // ISO timestamp
  reason: string;
  date: string;   // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  // relations (joined)
  person?: Person;
  program?: Program;
}

export interface ProgramParticipant {
  id: string;
  program_id: string;
  person_id: string;
  person?: Person;
}

// برای فرم‌ها
export type PersonFormData = Omit<Person, 'id' | 'created_at'>;
export type ProgramFormData = Omit<Program, 'id' | 'created_at'>;

// آمار فرد
export interface PersonStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  presentPercent: number;
}

// آمار برنامه
export interface ProgramStats {
  total: number;
  present: number;
  absent: number;
  late: number;
}
