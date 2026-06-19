import dayjs from 'dayjs';
import type { FollowupRecord, FollowupStatus, FollowupUrgency } from '@/types';

const today = dayjs();
const fmt = 'YYYY-MM-DD';

const genId = (prefix: string, idx: number) => `${prefix}${String(idx).padStart(3, '0')}`;

export const mockFollowups: FollowupRecord[] = [
  {
    id: genId('f', 1),
    patientId: 'p002',
    treatmentType: 'root_canal_seal',
    treatmentTypeName: '根管封药',
    purpose: '检查封药效果，进行根管充填',
    intervalDays: 7,
    suggestedDate: today.add(7, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '09:00',
    status: 'scheduled_confirmed',
    urgency: 'urgent',
    doctorNote: '患者上次封药后疼痛明显，务必今天复查，如疼痛未缓解需重新换药',
    createTime: today.subtract(7, 'day').format(fmt + ' 14:30'),
  },
  {
    id: genId('f', 2),
    patientId: 'p007',
    treatmentType: 'extraction_check',
    treatmentTypeName: '拔牙后复查',
    purpose: '检查拔牙创口愈合情况，拆线',
    intervalDays: 7,
    suggestedDate: today.add(7, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '09:30',
    status: 'scheduled_confirmed',
    urgency: 'normal',
    doctorNote: '常规拆线，创口情况良好',
    createTime: today.subtract(5, 'day').format(fmt + ' 10:15'),
  },
  {
    id: genId('f', 3),
    patientId: 'p011',
    treatmentType: 'root_canal_seal',
    treatmentTypeName: '根管封药',
    purpose: '评估封药效果，准备充填',
    intervalDays: 7,
    suggestedDate: today.add(7, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '10:00',
    status: 'scheduled_unconfirmed',
    urgency: 'attention',
    doctorNote: '急性牙髓炎首次封药，患者工作忙，前台需确认是否到诊',
    createTime: today.subtract(3, 'day').format(fmt + ' 16:20'),
  },
  {
    id: genId('f', 4),
    patientId: 'p003',
    treatmentType: 'periodontal_recheck',
    treatmentTypeName: '牙周刮治后复查',
    purpose: '复查牙周脓肿恢复情况，评估治疗效果',
    intervalDays: 14,
    suggestedDate: today.add(14, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '10:30',
    status: 'scheduled_confirmed',
    urgency: 'attention',
    doctorNote: '老年患者有糖尿病，需注意感染控制，务必家属陪同',
    createTime: today.subtract(12, 'day').format(fmt + ' 09:00'),
  },
  {
    id: genId('f', 5),
    patientId: 'p006',
    treatmentType: 'crown_fitting',
    treatmentTypeName: '冠修复试戴',
    purpose: '试戴氧化锆全冠，调颌粘结',
    intervalDays: 14,
    suggestedDate: today.add(14, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '11:00',
    status: 'scheduled_unconfirmed',
    urgency: 'normal',
    doctorNote: '患者对美观要求高，需预留足够时间调颌',
    createTime: today.subtract(9, 'day').format(fmt + ' 15:45'),
  },
  {
    id: genId('f', 6),
    patientId: 'p001',
    treatmentType: 'implant_phase2',
    treatmentTypeName: '种植二期检查',
    purpose: '检查种植体骨结合情况，准备取模',
    intervalDays: 90,
    suggestedDate: today.add(90, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '14:00',
    status: 'scheduled_confirmed',
    urgency: 'normal',
    doctorNote: '种植一期术后3个月，拍CBCT确认骨结合',
    createTime: today.subtract(88, 'day').format(fmt + ' 11:20'),
  },
  {
    id: genId('f', 7),
    patientId: 'p009',
    treatmentType: 'orthodontic_adjust',
    treatmentTypeName: '正畸调整',
    purpose: '常规正畸调整，检查咬合',
    intervalDays: 28,
    suggestedDate: today.add(28, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '14:30',
    status: 'scheduled_confirmed',
    urgency: 'normal',
    doctorNote: '青少年患者，需家长陪同，检查口腔卫生',
    createTime: today.subtract(25, 'day').format(fmt + ' 10:00'),
  },
  {
    id: genId('f', 8),
    patientId: 'p004',
    treatmentType: 'filling_observe',
    treatmentTypeName: '补牙观察',
    purpose: '评估安抚治疗效果，决定是否直接充填或根管治疗',
    intervalDays: 7,
    suggestedDate: today.add(7, 'day').format(fmt),
    scheduledDate: today.format(fmt),
    scheduledTime: '15:30',
    status: 'scheduled_unconfirmed',
    urgency: 'urgent',
    doctorNote: '深龋近髓，患者有自发痛症状，需密切观察，务必按期复诊',
    createTime: today.subtract(10, 'day').format(fmt + ' 16:00'),
  },
  {
    id: genId('f', 9),
    patientId: 'p010',
    treatmentType: 'extraction_check',
    treatmentTypeName: '拔牙后复查',
    purpose: '检查残根拔除创口，排除干槽症',
    intervalDays: 7,
    suggestedDate: today.add(7, 'day').format(fmt),
    scheduledDate: today.subtract(1, 'day').format(fmt),
    scheduledTime: '10:00',
    status: 'no_show',
    urgency: 'urgent',
    doctorNote: '老年高血压患者，拔牙后需密切观察，高血压药常规服用',
    createTime: today.subtract(8, 'day').format(fmt + ' 11:30'),
    frontDeskNote: '前台昨天上午致电未接通，微信留言未回复',
    followupAttempts: [
      { id: 'a1', time: today.subtract(1, 'day').format(fmt + ' 08:30'), method: 'phone', result: 'no_answer', note: '第一次拨打电话未接通', operator: '前台小王' },
      { id: 'a2', time: today.subtract(1, 'day').format(fmt + ' 09:45'), method: 'wechat', result: 'no_answer', note: '发送微信消息提醒复诊', operator: '前台小王' },
      { id: 'a3', time: today.format(fmt + ' 09:00'), method: 'phone', result: 'connected', note: '老伴接听，说患者昨天头晕没敢出门，明天上午来', operator: '前台小王' },
    ],
    nextAction: '明天上午再次致电确认，若仍未来诊需重点关注创口情况',
  },
  {
    id: genId('f', 10),
    patientId: 'p005',
    treatmentType: 'periodontal_recheck',
    treatmentTypeName: '牙周刮治后复查',
    purpose: '全口牙周复查，评估治疗效果，安排维护期',
    intervalDays: 14,
    suggestedDate: today.add(14, 'day').format(fmt),
    scheduledDate: today.add(1, 'day').format(fmt),
    scheduledTime: '09:30',
    status: 'scheduled_unconfirmed',
    urgency: 'attention',
    doctorNote: '重度牙周炎患者，需严格按维护期复诊',
    createTime: today.subtract(12, 'day').format(fmt + ' 14:20'),
  },
  {
    id: genId('f', 11),
    patientId: 'p008',
    treatmentType: 'implant_phase2',
    treatmentTypeName: '种植二期检查',
    purpose: '检查骨结合情况，安装愈合基台',
    intervalDays: 90,
    suggestedDate: today.add(90, 'day').format(fmt),
    scheduledDate: today.add(2, 'day').format(fmt),
    scheduledTime: '10:30',
    status: 'scheduled_confirmed',
    urgency: 'normal',
    doctorNote: '骨质疏松患者，骨结合可能稍慢，拍CBCT评估',
    createTime: today.subtract(85, 'day').format(fmt + ' 09:00'),
  },
  {
    id: genId('f', 12),
    patientId: 'p012',
    treatmentType: 'filling_observe',
    treatmentTypeName: '补牙观察',
    purpose: '复查楔状缺损充填情况，评估敏感症状',
    intervalDays: 14,
    suggestedDate: today.add(14, 'day').format(fmt),
    scheduledDate: today.add(4, 'day').format(fmt),
    scheduledTime: '15:00',
    status: 'pending_schedule',
    urgency: 'normal',
    doctorNote: '牙齿敏感患者，观察充填后症状变化',
    createTime: today.subtract(10, 'day').format(fmt + ' 10:30'),
  },
  {
    id: genId('f', 13),
    patientId: 'p001',
    treatmentType: 'periodontal_recheck',
    treatmentTypeName: '牙周刮治后复查',
    purpose: '复查牙周情况，安排后续种植治疗',
    intervalDays: 14,
    suggestedDate: today.add(14, 'day').format(fmt),
    scheduledDate: today.subtract(14, 'day').format(fmt),
    scheduledTime: '10:00',
    status: 'completed',
    urgency: 'normal',
    doctorNote: '牙周控制稳定，可以进入种植二期程序',
    createTime: today.subtract(28, 'day').format(fmt + ' 09:00'),
  },
  {
    id: genId('f', 14),
    patientId: 'p002',
    treatmentType: 'orthodontic_adjust',
    treatmentTypeName: '正畸调整',
    purpose: '常规调整',
    intervalDays: 28,
    suggestedDate: today.add(28, 'day').format(fmt),
    scheduledDate: today.subtract(21, 'day').format(fmt),
    scheduledTime: '14:00',
    status: 'completed',
    urgency: 'normal',
    doctorNote: '矫治进展顺利',
    createTime: today.subtract(49, 'day').format(fmt + ' 14:00'),
  },
  {
    id: genId('f', 15),
    patientId: 'p003',
    treatmentType: 'periodontal_recheck',
    treatmentTypeName: '牙周刮治后复查',
    purpose: '评估牙周脓肿消退情况',
    intervalDays: 7,
    suggestedDate: today.add(7, 'day').format(fmt),
    scheduledDate: today.subtract(42, 'day').format(fmt),
    scheduledTime: '11:00',
    status: 'completed',
    urgency: 'attention',
    doctorNote: '脓肿消退，进行全口洁治',
    createTime: today.subtract(49, 'day').format(fmt + ' 09:30'),
  },
];

export const getFollowupsByStatus = (statuses: FollowupStatus[]) => {
  return mockFollowups.filter(f => statuses.includes(f.status));
};

export const getFollowupsByDate = (date: string) => {
  return mockFollowups.filter(f => f.scheduledDate === date);
};

export const getFollowupsByPatient = (patientId: string) => {
  return mockFollowups.filter(f => f.patientId === patientId);
};

export const getUrgencyColor = (urgency: FollowupUrgency): { bg: string; text: string; label: string } => {
  switch (urgency) {
    case 'urgent':
      return { bg: '#FEE2E2', text: '#DC2626', label: '紧急' };
    case 'attention':
      return { bg: '#FEF3C7', text: '#D97706', label: '注意' };
    default:
      return { bg: '#E0F2FE', text: '#0284C7', label: '常规' };
  }
};

export const getStatusInfo = (status: FollowupStatus): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'scheduled_confirmed':
      return { bg: '#D1FAE5', text: '#059669', label: '已确认' };
    case 'scheduled_unconfirmed':
      return { bg: '#FEF3C7', text: '#D97706', label: '待确认' };
    case 'pending_schedule':
      return { bg: '#E0F2FE', text: '#0284C7', label: '待安排' };
    case 'completed':
      return { bg: '#F3F4F6', text: '#6B7280', label: '已完成' };
    case 'no_show':
      return { bg: '#FEE2E2', text: '#DC2626', label: '已爽约' };
    case 'cancelled':
      return { bg: '#E5E7EB', text: '#9CA3AF', label: '已取消' };
    default:
      return { bg: '#F3F4F6', text: '#6B7280', label: '未知' };
  }
};
