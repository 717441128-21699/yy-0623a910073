import { create } from 'zustand';
import type { Patient, FollowupRecord, DoctorProfile, DailyStats, FollowupStatus, TreatmentType } from '@/types';
import { mockPatients } from '@/data/patients';
import { mockFollowups } from '@/data/followups';
import dayjs from 'dayjs';

interface ClinicState {
  patients: Patient[];
  followups: FollowupRecord[];
  doctorProfile: DoctorProfile;
  selectedPatient: Patient | null;
  selectedFollowup: FollowupRecord | null;
  
  getPatientById: (id: string) => Patient | undefined;
  getFollowupsByPatientId: (patientId: string) => FollowupRecord[];
  getFollowupsByStatus: (statuses: FollowupStatus[]) => FollowupRecord[];
  getFollowupsByDate: (date: string) => FollowupRecord[];
  getTodayStats: () => DailyStats;
  
  setSelectedPatient: (patient: Patient | null) => void;
  setSelectedFollowup: (followup: FollowupRecord | null) => void;
  
  addFollowup: (data: {
    patientId: string;
    treatmentType: TreatmentType;
    treatmentTypeName: string;
    purpose: string;
    intervalDays: number;
    doctorNote: string;
    urgency: 'normal' | 'attention' | 'urgent';
  }) => void;
  
  updateFollowupStatus: (id: string, status: FollowupStatus) => void;
  addFollowupAttempt: (followupId: string, attempt: FollowupRecord['followupAttempts'][0]) => void;
  searchPatients: (keyword: string) => Patient[];
}

export const useClinicStore = create<ClinicState>((set, get) => ({
  patients: mockPatients,
  followups: mockFollowups,
  doctorProfile: {
    name: '李明远',
    title: '副主任医师',
    department: '口腔综合科',
    clinic: '康美口腔门诊部',
  },
  selectedPatient: null,
  selectedFollowup: null,

  getPatientById: (id) => get().patients.find(p => p.id === id),
  
  getFollowupsByPatientId: (patientId) => 
    get().followups.filter(f => f.patientId === patientId).sort((a, b) => 
      dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf()
    ),
  
  getFollowupsByStatus: (statuses) => 
    get().followups.filter(f => statuses.includes(f.status)),
  
  getFollowupsByDate: (date) => 
    get().followups.filter(f => f.scheduledDate === date),
  
  getTodayStats: () => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayFollowups = get().getFollowupsByDate(today);
    return {
      date: today,
      totalAppointments: todayFollowups.length,
      confirmed: todayFollowups.filter(f => f.status === 'scheduled_confirmed').length,
      unconfirmed: todayFollowups.filter(f => f.status === 'scheduled_unconfirmed').length,
      completed: todayFollowups.filter(f => f.status === 'completed').length,
      noShow: todayFollowups.filter(f => f.status === 'no_show').length,
    };
  },

  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  setSelectedFollowup: (followup) => set({ selectedFollowup: followup }),

  addFollowup: (data) => {
    const newFollowup: FollowupRecord = {
      id: `f${Date.now()}`,
      patientId: data.patientId,
      treatmentType: data.treatmentType,
      treatmentTypeName: data.treatmentTypeName,
      purpose: data.purpose,
      intervalDays: data.intervalDays,
      suggestedDate: dayjs().add(data.intervalDays, 'day').format('YYYY-MM-DD'),
      status: 'pending_schedule',
      urgency: data.urgency,
      doctorNote: data.doctorNote,
      createTime: dayjs().format('YYYY-MM-DD HH:mm'),
      followupAttempts: [],
    };
    set((state) => ({ followups: [newFollowup, ...state.followups] }));
  },

  updateFollowupStatus: (id, status) => {
    set((state) => ({
      followups: state.followups.map(f => 
        f.id === id ? { ...f, status } : f
      ),
    }));
  },

  addFollowupAttempt: (followupId, attempt) => {
    set((state) => ({
      followups: state.followups.map(f => 
        f.id === followupId 
          ? { ...f, followupAttempts: [...(f.followupAttempts || []), attempt] } 
          : f
      ),
    }));
  },

  searchPatients: (keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return get().patients.filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.phone.includes(keyword) ||
      (p.medicalRecordNo && p.medicalRecordNo.toLowerCase().includes(lowerKeyword))
    );
  },
}));
