import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import type { FollowupRecord } from '@/types';
import { useClinicStore } from '@/store/clinicStore';
import { getRelativeDateLabel, getWeekday, formatDate } from '@/utils/date';

interface FollowupCardProps {
  followup: FollowupRecord;
  variant?: 'default' | 'compact' | 'timeline';
  onClick?: () => void;
  showPatientInfo?: boolean;
}

const FollowupCard: React.FC<FollowupCardProps> = ({ 
  followup, 
  variant = 'default',
  onClick,
  showPatientInfo = true,
}) => {
  const getPatientById = useClinicStore(state => state.getPatientById);
  const patient = getPatientById(followup.patientId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/followupDetail/index?id=${followup.id}`,
      });
    }
  };

  const dateLabel = followup.scheduledDate 
    ? getRelativeDateLabel(followup.scheduledDate)
    : `建议${getRelativeDateLabel(followup.suggestedDate)}`;
  
  const weekday = followup.scheduledDate ? getWeekday(followup.scheduledDate) : '';
  const dateStr = followup.scheduledDate || followup.suggestedDate;

  const handlePatientClick = (e: any) => {
    e.stopPropagation();
    if (patient) {
      Taro.navigateTo({
        url: `/pages/patientDetail/index?id=${patient.id}`,
      });
    }
  };

  if (variant === 'timeline') {
    return (
      <View className={styles.timelineCard} onClick={handleClick}>
        <View className={styles.timelineLeft}>
          <View className={styles.timeDot} />
          <View className={styles.timeLine} />
        </View>
        <View className={styles.timelineContent}>
          <View className={styles.timeRow}>
            <Text className={styles.timeText}>
              {followup.scheduledTime || '--:--'}
            </Text>
            <StatusBadge type="status" value={followup.status} size="sm" />
            <StatusBadge type="urgency" value={followup.urgency} size="sm" />
          </View>
          {showPatientInfo && patient && (
            <View className={styles.patientRow} onClick={handlePatientClick}>
              <Text className={styles.patientName}>{patient.name}</Text>
              <Text className={styles.patientAge}>{patient.gender === 'male' ? '男' : '女'} · {patient.age}岁</Text>
            </View>
          )}
          <Text className={styles.treatmentName}>{followup.treatmentTypeName}</Text>
          {followup.doctorNote && (
            <View className={styles.noteBox}>
              <Text className={styles.noteText}>{followup.doctorNote}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (variant === 'compact') {
    return (
      <View className={classnames(styles.card, styles.compactCard)} onClick={handleClick}>
        <View className={styles.compactLeft}>
          <View className={styles.dateBlock}>
            <Text className={styles.dateDay}>{formatDate(dateStr, 'DD')}</Text>
            <Text className={styles.dateMonth}>{formatDate(dateStr, 'M月')}</Text>
          </View>
        </View>
        <View className={styles.compactMain}>
          <View className={styles.compactRow1}>
            {showPatientInfo && patient && (
              <Text className={styles.patientName} onClick={handlePatientClick}>{patient.name}</Text>
            )}
            <Text className={styles.treatmentName}>{followup.treatmentTypeName}</Text>
          </View>
          <View className={styles.compactRow2}>
            <StatusBadge type="status" value={followup.status} size="sm" />
            <StatusBadge type="urgency" value={followup.urgency} size="sm" />
          </View>
          {followup.doctorNote && (
            <Text className={styles.compactNote}>📝 {followup.doctorNote}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={classnames(styles.card, styles.clickable)} onClick={handleClick}>
      <View className={styles.topRow}>
        <View className={styles.dateInfo}>
          <View className={styles.dateMain}>
            <Text className={styles.dateLabel}>{dateLabel}</Text>
            {weekday && <Text className={styles.weekday}>{weekday}</Text>}
          </View>
          {followup.scheduledTime && (
            <Text className={styles.timeSlot}>🕐 {followup.scheduledTime}</Text>
          )}
        </View>
        <View className={styles.badgeGroup}>
          <StatusBadge type="status" value={followup.status} size="sm" />
          <StatusBadge type="urgency" value={followup.urgency} size="sm" />
        </View>
      </View>

      {showPatientInfo && patient && (
        <View className={styles.patientBlock} onClick={handlePatientClick}>
          <View className={styles.avatarMini} style={{ background: patient.gender === 'male' ? '#DBEAFE' : '#FCE7F3' }}>
            <Text style={{ color: patient.gender === 'male' ? '#2563EB' : '#DB2777' }}>{patient.name.charAt(0)}</Text>
          </View>
          <View className={styles.patientInfo}>
            <View className={styles.patientLine1}>
              <Text className={styles.patientName}>{patient.name}</Text>
              <Text className={styles.patientAge}>{patient.gender === 'male' ? '男' : '女'} · {patient.age}岁</Text>
            </View>
            <Text className={styles.patientPhone}>{patient.phone}</Text>
          </View>
        </View>
      )}

      <View className={styles.treatmentBlock}>
        <View className={styles.treatmentRow}>
          <View className={styles.treatmentTag}>
            <Text className={styles.treatmentLabel}>治疗项目</Text>
          </View>
          <Text className={styles.treatmentValue}>{followup.treatmentTypeName}</Text>
        </View>
        <View className={styles.treatmentRow}>
          <View className={styles.treatmentTag}>
            <Text className={styles.treatmentLabel}>复诊目的</Text>
          </View>
          <Text className={styles.treatmentValue}>{followup.purpose}</Text>
        </View>
      </View>

      {followup.doctorNote && (
        <View className={styles.noteBlock}>
          <Text className={styles.noteTitle}>📋 医生备注</Text>
          <Text className={styles.noteContent}>{followup.doctorNote}</Text>
        </View>
      )}

      {followup.status === 'no_show' && followup.frontDeskNote && (
        <View className={styles.frontDeskBlock}>
          <Text className={styles.frontDeskTitle}>💼 前台跟进</Text>
          <Text className={styles.frontDeskContent}>{followup.frontDeskNote}</Text>
        </View>
      )}
    </View>
  );
};

export default FollowupCard;
