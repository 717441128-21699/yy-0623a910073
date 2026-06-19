import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useClinicStore } from '@/store/clinicStore';
import { 
  TREATMENT_TYPE_OPTIONS, 
  INTERVAL_OPTIONS, 
  FOLLOWUP_PURPOSE_OPTIONS 
} from '@/types';
import type { TreatmentType, FollowupUrgency } from '@/types';
import { addDays, formatDate } from '@/utils/date';

type PurposeOption = (typeof FOLLOWUP_PURPOSE_OPTIONS)[number] | 'custom';

const treatmentIcons: Record<TreatmentType, string> = {
  filling_observe: '🦷',
  periodontal_recheck: '🩺',
  root_canal_seal: '🔐',
  implant_phase2: '🌱',
  crown_fitting: '👑',
  extraction_check: '✨',
  orthodontic_adjust: '📐',
  other: '📋',
};

const commonNotes = [
  '疼痛明显，务必尽快复查',
  '老人需家属陪同就诊',
  '注意口腔卫生，清淡饮食',
  '避免用患侧咀嚼',
  '高血压药正常服用',
];

const urgencyOptions = [
  { key: 'normal' as FollowupUrgency, icon: '📅', label: '常规', desc: '按预约时间即可' },
  { key: 'attention' as FollowupUrgency, icon: '⚡', label: '注意', desc: '前台需重点确认' },
  { key: 'urgent' as FollowupUrgency, icon: '🚨', label: '紧急', desc: '务必按期到诊' },
];

const ScheduleFollowupPage: React.FC = () => {
  const router = useRouter();
  const patientId = router.params.patientId as string;
  
  const getPatientById = useClinicStore(state => state.getPatientById);
  const addFollowup = useClinicStore(state => state.addFollowup);

  const patient = useMemo(() => patientId ? getPatientById(patientId) : null, [patientId, getPatientById]);
  
  const [treatmentType, setTreatmentType] = useState<TreatmentType | null>(null);
  const [intervalDays, setIntervalDays] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<string>('');
  const [isCustomPurpose, setIsCustomPurpose] = useState(false);
  const [customPurpose, setCustomPurpose] = useState('');
  const [urgency, setUrgency] = useState<FollowupUrgency>('normal');
  const [doctorNote, setDoctorNote] = useState('');

  useEffect(() => {
    if (treatmentType) {
      const option = TREATMENT_TYPE_OPTIONS.find(o => o.value === treatmentType);
      if (option && !intervalDays) {
        setIntervalDays(option.defaultInterval);
        console.log('[ScheduleFollowup] 根据治疗类型设置默认间隔:', option.defaultInterval, '天');
      }
    }
  }, [treatmentType, intervalDays]);

  useEffect(() => {
    if (isCustomPurpose) {
      setPurpose(customPurpose);
    }
  }, [isCustomPurpose, customPurpose]);

  const selectedTreatmentName = useMemo(() => {
    if (!treatmentType) return '';
    return TREATMENT_TYPE_OPTIONS.find(o => o.value === treatmentType)?.label || '';
  }, [treatmentType]);

  const suggestedDate = useMemo(() => {
    if (!intervalDays) return '';
    return addDays(dayjs().format('YYYY-MM-DD'), intervalDays);
  }, [intervalDays]);

  const isFormValid = useMemo(() => {
    return !!treatmentType && !!intervalDays && !!purpose;
  }, [treatmentType, intervalDays, purpose]);

  const handleTreatmentSelect = (type: TreatmentType) => {
    setTreatmentType(type);
    const option = TREATMENT_TYPE_OPTIONS.find(o => o.value === type);
    if (option) {
      setIntervalDays(option.defaultInterval);
    }
  };

  const handleIntervalSelect = (days: number) => {
    setIntervalDays(days);
  };

  const handleUseDefaultInterval = () => {
    if (treatmentType) {
      const option = TREATMENT_TYPE_OPTIONS.find(o => o.value === treatmentType);
      if (option) {
        setIntervalDays(option.defaultInterval);
      }
    }
  };

  const handlePurposeSelect = (p: PurposeOption) => {
    if (p === 'custom') {
      setIsCustomPurpose(true);
    } else {
      setIsCustomPurpose(false);
      setPurpose(p);
    }
  };

  const insertNote = (text: string) => {
    if (doctorNote) {
      setDoctorNote(doctorNote + '；' + text);
    } else {
      setDoctorNote(text);
    }
  };

  const handleSubmit = () => {
    if (!patientId || !treatmentType || !intervalDays || !purpose) {
      Taro.showToast({ title: '请完整填写复诊信息', icon: 'none' });
      return;
    }

    try {
      addFollowup({
        patientId,
        treatmentType,
        treatmentTypeName: selectedTreatmentName,
        purpose,
        intervalDays,
        doctorNote,
        urgency,
      });

      console.log('[ScheduleFollowup] 复诊安排成功:', {
        patient: patient?.name,
        treatment: selectedTreatmentName,
        interval: intervalDays,
        purpose,
        urgency,
      });

      Taro.showModal({
        title: '✅ 复诊安排成功',
        content: `已生成 ${selectedTreatmentName} 复诊建议\n建议复诊日期：${suggestedDate}\n前台将尽快安排预约并通知患者`,
        showCancel: false,
        confirmText: '好的',
        confirmColor: '#0FA5A5',
        success: () => {
          Taro.switchTab({ url: '/pages/followups/index' });
        },
      });
    } catch (err) {
      console.error('[ScheduleFollowup] 创建复诊失败:', err);
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' });
    }
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  if (!patient) {
    return (
      <ScrollView className={styles.pageWrapper}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 28, color: '#999' }}>未找到患者信息</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.pageWrapper} scrollY>
      <View className={styles.patientBar}>
        <View className={styles.patientBarAvatar}>
          <Text className={styles.patientBarAvatarText}>{patient.name.charAt(0)}</Text>
        </View>
        <View className={styles.patientBarInfo}>
          <Text className={styles.patientBarName}>{patient.name}</Text>
          <Text className={styles.patientBarMeta}>
            {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁 · {patient.phone}
          </Text>
        </View>
        <View className={styles.patientBarTip}>结束诊疗</View>
      </View>

      <View className={styles.content}>
        <View className={styles.formSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.stepNum}>
              <Text className={styles.stepNumText}>1</Text>
            </View>
            <Text className={styles.sectionTitle}>本次处理内容</Text>
            <Text className={styles.sectionRequired}>* 必填</Text>
          </View>
          <View className={styles.treatmentGrid}>
            {TREATMENT_TYPE_OPTIONS.map(opt => (
              <View
                key={opt.value}
                className={classnames(styles.treatmentItem, treatmentType === opt.value && styles.selected)}
                onClick={() => handleTreatmentSelect(opt.value)}
              >
                <Text className={styles.treatmentIcon}>{treatmentIcons[opt.value]}</Text>
                <Text className={styles.treatmentLabel}>{opt.label}</Text>
                <Text className={styles.treatmentHint}>建议{opt.defaultInterval}天后复诊</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.stepNum}>
              <Text className={styles.stepNumText}>2</Text>
            </View>
            <Text className={styles.sectionTitle}>建议复诊间隔</Text>
            <Text className={styles.sectionRequired}>* 必填</Text>
          </View>
          
          <View className={styles.intervalRow}>
            <Text className={styles.intervalLabel}>当前选择</Text>
            <Text className={styles.intervalValue}>
              {intervalDays ? `${INTERVAL_OPTIONS.find(o => o.value === intervalDays)?.label || intervalDays + '天'}（${formatDate(suggestedDate)}）` : '请选择间隔'}
            </Text>
            {treatmentType && (
              <View className={styles.intervalSuggest} onClick={handleUseDefaultInterval}>
                使用建议
              </View>
            )}
          </View>
          
          <View className={styles.intervalChips}>
            {INTERVAL_OPTIONS.map(opt => (
              <View
                key={opt.value}
                className={classnames(styles.intervalChip, intervalDays === opt.value && styles.selected)}
                onClick={() => handleIntervalSelect(opt.value)}
              >
                <Text className={styles.intervalChipText}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.stepNum}>
              <Text className={styles.stepNumText}>3</Text>
            </View>
            <Text className={styles.sectionTitle}>复诊目的</Text>
            <Text className={styles.sectionRequired}>* 必填</Text>
          </View>
          
          <View className={styles.purposeList}>
            {FOLLOWUP_PURPOSE_OPTIONS.map(p => (
              <View
                key={p}
                className={classnames(styles.purposeItem, !isCustomPurpose && purpose === p && styles.selected)}
                onClick={() => handlePurposeSelect(p)}
              >
                <View className={styles.purposeRadio} />
                <Text className={styles.purposeText}>{p}</Text>
              </View>
            ))}
            <View
              className={classnames(styles.purposeItem, isCustomPurpose && styles.selected)}
              onClick={() => handlePurposeSelect('custom')}
            >
              <View className={styles.purposeRadio} />
              <Text className={styles.purposeText}>自定义复诊目的...</Text>
            </View>
          </View>
          
          {isCustomPurpose && (
            <View className={styles.purposeCustom}>
              <Textarea
                className={styles.noteArea}
                placeholder="请输入自定义复诊目的..."
                value={customPurpose}
                onInput={(e) => setCustomPurpose(e.detail.value)}
                maxlength={100}
              />
            </View>
          )}
        </View>

        <View className={styles.formSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.stepNum}>
              <Text className={styles.stepNumText}>4</Text>
            </View>
            <Text className={styles.sectionTitle}>紧急程度</Text>
          </View>
          
          <View className={styles.urgencyRow}>
            {urgencyOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.urgencyCard, styles[opt.key], urgency === opt.key && styles.selected)}
                onClick={() => setUrgency(opt.key)}
              >
                <Text className={styles.urgencyIcon}>{opt.icon}</Text>
                <Text className={styles.urgencyLabel}>{opt.label}</Text>
                <Text className={styles.urgencyDesc}>{opt.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.stepNum}>
              <Text className={styles.stepNumText}>5</Text>
            </View>
            <Text className={styles.sectionTitle}>医生备注（可选）</Text>
          </View>
          
          <Textarea
            className={styles.noteArea}
            placeholder="请输入给前台或下次自己看的备注，例如：患者疼痛明显，务必尽快复诊..."
            value={doctorNote}
            onInput={(e) => setDoctorNote(e.detail.value)}
            maxlength={200}
          />
          
          <View className={styles.notePlaceholders}>
            {commonNotes.map(note => (
              <View key={note} className={styles.placeholderTag} onClick={() => insertNote(note)}>
                <Text className={styles.placeholderText}>+ {note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.stepNum}>
              <Text className={styles.stepNumText}>📋</Text>
            </View>
            <Text className={styles.sectionTitle}>生成给前台的预约建议</Text>
          </View>
          
          <View className={styles.previewCard}>
            <View className={styles.previewHeader}>
              <View className={styles.previewBadge}>
                <Text className={styles.previewBadgeText}>待前台安排</Text>
              </View>
              <Text className={styles.previewTitle}>
                {patient.name}的复诊预约
              </Text>
            </View>
            
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>治疗项目</Text>
              <Text className={styles.previewValue}>{selectedTreatmentName || '未选择'}</Text>
            </View>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>建议日期</Text>
              <Text className={styles.previewValue} style={{ color: '#0A8585' }}>
                {suggestedDate || '未选择'}（前后浮动2-3天）
              </Text>
            </View>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>复诊目的</Text>
              <Text className={styles.previewValue}>{purpose || '未选择'}</Text>
            </View>
            <View className={styles.previewRow}>
              <Text className={styles.previewLabel}>紧急程度</Text>
              <Text className={styles.previewValue} style={{ 
                color: urgency === 'urgent' ? '#DC2626' : 
                       urgency === 'attention' ? '#D97706' : '#0284C7' 
              }}>
                {urgencyOptions.find(o => o.key === urgency)?.label}
              </Text>
            </View>
            {doctorNote && (
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>医生备注</Text>
                <Text className={styles.previewValue} style={{ color: '#D97706' }}>
                  {doctorNote}
                </Text>
              </View>
            )}
            
            <View className={styles.previewFooter}>
              <Text className={styles.previewFooterIcon}>💡</Text>
              <Text className={styles.previewFooterText}>
                前台将根据此建议为患者安排具体时间，安排完成后会自动更新为「已排期」状态
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.cancelBtn} onClick={handleCancel}>
          <Text className={styles.cancelBtnText}>取消</Text>
        </View>
        <View 
          className={classnames(styles.submitBtn, !isFormValid && styles.disabled)} 
          onClick={handleSubmit}
        >
          <Text className={styles.submitBtnText}>
            {isFormValid ? '生成复诊预约' : '请完善信息'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ScheduleFollowupPage;
