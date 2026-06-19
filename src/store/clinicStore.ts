import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Patient, FollowupRecord, FollowupAttempt, DoctorProfile, DailyStats, FollowupStatus, TreatmentType } from '@/types';
import { mockPatients } from '@/data/patients';
import { mockFollowups } from '@/data/followups';
import dayjs from 'dayjs';

const STORAGE_KEY_FOLLOWUPS = 'clinic_followups';
const STORAGE_KEY_PATIENTS = 'clinic_patients';

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error('[ClinicStore] 读取storage失败:', key, err);
  }
  return fallback;
};

const saveToStorage = <T>(key: string, data: T) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (err) {
    console.error('[ClinicStore] 写入storage失败:', key, err);
  }
};

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
    replaceFollowupId?: string;
  }) => void;
  
  updateFollowupStatus: (id: string, status: FollowupStatus) => void;
  updateFollowup: (id: string, patch: Partial<FollowupRecord>) => void;
  addFollowupAttempt: (followupId: string, attempt: FollowupAttempt) => void;
  resolveNoShow: (followupId: string, decision: 'reschedule' | 'mark_important' | 'stop_followup', note: string) => void;
  searchPatients: (keyword: string) => Patient[];
  _persist: () => void;
}

export const useClinicStore = create<ClinicState>((set, get) => ({
  patients: loadFromStorage(STORAGE_KEY_PATIENTS, mockPatients),
  followups: loadFromStorage(STORAGE_KEY_FOLLOWUPS, mockFollowups),
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
    
    set((state) => {
      let updated = [newFollowup, ...state.followups];
      if (data.replaceFollowupId) {
        updated = updated.map(f => 
          f.id === data.replaceFollowupId 
            ? { ...f, status: 'cancelled' as FollowupStatus, nextAction: `已重新安排复诊（新记录 #${newFollowup.id}）` }
            : f
        );
      }
      return { followups: updated };
    });
    
    get()._persist();
    console.log('[ClinicStore] 新增复诊:', newFollowup.id, data.replaceFollowupId ? `(替换旧爽约: ${data.replaceFollowupId})` : '');
  },

  updateFollowupStatus: (id, status) => {
    set((state) => ({
      followups: state.followups.map(f => 
        f.id === id ? { ...f, status } : f
      ),
    }));
    get()._persist();
  },

  updateFollowup: (id, patch) => {
    set((state) => ({
      followups: state.followups.map(f => 
        f.id === id ? { ...f, ...patch } : f
      ),
    }));
    get()._persist();
  },

  addFollowupAttempt: (followupId, attempt) => {
    set((state) => ({
      followups: state.followups.map(f => 
        f.id === followupId 
          ? { ...f, followupAttempts: [...(f.followupAttempts || []), attempt] } 
          : f
      ),
    }));
    get()._persist();
  },

  resolveNoShow: (followupId, decision, note) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const decisionMap = {
      reschedule: '📅 医生决定重新安排',
      mark_important: '📌 医生标记为重点关注',
      stop_followup: '✋ 医生决定停止追访',
    };
    
    set((state) => ({
      followups: state.followups.map(f => {
        if (f.id !== followupId) return f;
        const newAttempt: FollowupAttempt = {
          id: `a${Date.now()}`,
          time: now,
          method: 'wechat',
          result: decision === 'reschedule' ? 'rescheduled' : decision === 'stop_followup' ? 'refused' : 'connected',
          note: `${decisionMap[decision]}：${note}`,
          operator: '李医生',
        };
        return {
          ...f,
          followupAttempts: [...(f.followupAttempts || []), newAttempt],
          nextAction: `${decisionMap[decision]}（${now}）${note ? ' — ' + note : ''}`,
        };
      }),
    }));
    get()._persist();
    console.log('[ClinicStore] 爽约处理:', followupId, decision);
  },

  searchPatients: (keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return get().patients.filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.phone.includes(keyword) ||
      (p.medicalRecordNo && p.medicalRecordNo.toLowerCase().includes(lowerKeyword))
    );
  },

  _persist: () => {
    const { followups, patients } = get();
    saveToStorage(STORAGE_KEY_FOLLOWUPS, followups);
    saveToStorage(STORAGE_KEY_PATIENTS, patients);
  },
}));
