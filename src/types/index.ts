
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
  date: string;
  start_time: string;
  end_time: string | null;
  created_at: string;
}

export type AttendanceStatus = 'حاضر' | 'غایب' | 'تاخیر';

export interface Attendance {
  id: string;
  program_id: string;
  person_id: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  reason: string;
  date: string;
  created_at: string;
  updated_at: string;

  person?: Person;
  program?: Program;
}

export interface ProgramParticipant {
  id: string;
  program_id: string;
  person_id: string;
  person?: Person;
}


export type PersonFormData = Omit<Person, 'id' | 'created_at'>;
export type ProgramFormData = Omit<Program, 'id' | 'created_at'>;


export interface PersonStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  presentPercent: number;
}


export interface ProgramStats {
  total: number;
  present: number;
  absent: number;
  late: number;
}
