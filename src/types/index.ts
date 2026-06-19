export type TreatmentType = 
  | 'filling_observe' 
  | 'periodontal_recheck' 
  | 'root_canal_seal' 
  | 'implant_phase2'
  | 'crown_fitting'
  | 'extraction_check'
  | 'orthodontic_adjust'
  | 'other';

export const TREATMENT_TYPE_OPTIONS: { value: TreatmentType; label: string; defaultInterval: number; color: string }[] = [
  { value: 'filling_observe', label: '补牙观察', defaultInterval: 7, color: '#10B981' },
  { value: 'periodontal_recheck', label: '牙周刮治后复查', defaultInterval: 14, color: '#2563EB' },
  { value: 'root_canal_seal', label: '根管封药', defaultInterval: 7, color: '#F59E0B' },
  { value: 'implant_phase2', label: '种植二期检查', defaultInterval: 90, color: '#8B5CF6' },
  { value: 'crown_fitting', label: '冠修复试戴', defaultInterval: 14, color: '#EC4899' },
  { value: 'extraction_check', label: '拔牙后复查', defaultInterval: 7, color: '#EF4444' },
  { value: 'orthodontic_adjust', label: '正畸调整', defaultInterval: 28, color: '#06B6D4' },
  { value: 'other', label: '其他治疗', defaultInterval: 30, color: '#6B7280' },
];

export const INTERVAL_OPTIONS = [
  { value: 3, label: '3天' },
  { value: 7, label: '1周' },
  { value: 14, label: '2周' },
  { value: 21, label: '3周' },
  { value: 28, label: '1个月' },
  { value: 60, label: '2个月' },
  { value: 90, label: '3个月' },
  { value: 180, label: '半年' },
];

export const FOLLOWUP_PURPOSE_OPTIONS = [
  '检查愈合情况',
  '评估治疗效果',
  '进行下一步治疗',
  '拆线/换药',
  '影像学复查',
  '不适感排查',
  '常规维护',
];

export type FollowupStatus = 
  | 'pending_schedule'    // 待前台安排
  | 'scheduled_unconfirmed' // 已排期未确认
  | 'scheduled_confirmed'   // 已排期已确认
  | 'completed'             // 已完成
  | 'no_show'               // 患者爽约
  | 'cancelled';            // 已取消

export type FollowupUrgency = 'normal' | 'attention' | 'urgent';

export type NoShowResolution = 'reschedule' | 'mark_important' | 'stop_followup';

export interface FollowupRecord {
  id: string;
  patientId: string;
  treatmentType: TreatmentType;
  treatmentTypeName: string;
  purpose: string;
  intervalDays: number;
  suggestedDate: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status: FollowupStatus;
  urgency: FollowupUrgency;
  doctorNote: string;
  createTime: string;
  frontDeskNote?: string;
  followupAttempts?: FollowupAttempt[];
  nextAction?: string;
  noShowResolution?: NoShowResolution;
  replacedByFollowupId?: string;
}

export interface FollowupAttempt {
  id: string;
  time: string;
  method: 'phone' | 'wechat' | 'sms';
  result: 'connected' | 'no_answer' | 'busy' | 'rescheduled' | 'refused';
  note: string;
  operator: string;
}

export interface VisitRecord {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
  toothNumbers?: string[];
}

export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  avatar?: string;
  medicalRecordNo?: string;
  firstVisitDate?: string;
  visitCount?: number;
  tags?: string[];
  allergies?: string[];
  chronicDiseases?: string[];
  specialRemarks?: string;
  visitHistory: VisitRecord[];
}

export interface DoctorProfile {
  name: string;
  title: string;
  department: string;
  clinic: string;
  avatar?: string;
}

export interface DailyStats {
  date: string;
  totalAppointments: number;
  confirmed: number;
  unconfirmed: number;
  completed: number;
  noShow: number;
}
