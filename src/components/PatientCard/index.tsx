import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  showDetails?: boolean;
  onClick?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const getGenderText = (gender: 'male' | 'female') => gender === 'male' ? '男' : '女';
const getGenderBg = (gender: 'male' | 'female') => gender === 'male' ? '#DBEAFE' : '#FCE7F3';
const getGenderColor = (gender: 'male' | 'female') => gender === 'male' ? '#2563EB' : '#DB2777';

const PatientCard: React.FC<PatientCardProps> = ({ patient, showDetails = true, onClick, actionLabel, onAction }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/patientDetail/index?id=${patient.id}`,
      });
    }
  };

  return (
    <View className={classnames(styles.card, onClick && styles.clickable)} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.avatar} style={{ background: getGenderBg(patient.gender) }}>
          <Text className={styles.avatarText} style={{ color: getGenderColor(patient.gender) }}>
            {patient.name.charAt(0)}
          </Text>
        </View>
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{patient.name}</Text>
            <View className={styles.genderAge}>
              <Text className={styles.genderText}>{getGenderText(patient.gender)}</Text>
              <Text className={styles.separator}>·</Text>
              <Text className={styles.ageText}>{patient.age}岁</Text>
            </View>
          </View>
          <View className={styles.metaRow}>
            <Text className={styles.phone}>{patient.phone}</Text>
            {patient.medicalRecordNo && (
              <Text className={styles.recordNo}>病历号: {patient.medicalRecordNo}</Text>
            )}
          </View>
        </View>
        {actionLabel && (
          <View 
            className={styles.actionBtn} 
            onClick={(e) => { e.stopPropagation(); onAction && onAction(); }}
          >
            <Text className={styles.actionText}>{actionLabel}</Text>
          </View>
        )}
      </View>

      {showDetails && (
        <View className={styles.details}>
          {patient.tags && patient.tags.length > 0 && (
            <View className={styles.tagRow}>
              {patient.tags.map((tag, idx) => (
                <View key={idx} className={styles.tag}>
                  <Text className={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {patient.specialRemarks && (
            <View className={styles.remarkRow}>
              <Text className={styles.remarkLabel}>备注：</Text>
              <Text className={styles.remarkText}>{patient.specialRemarks}</Text>
            </View>
          )}
          <View className={styles.visitRow}>
            <Text className={styles.visitText}>
              初诊: {patient.firstVisitDate || '-'}{' '}
              · 累计就诊: <Text className={styles.visitCount}>{patient.visitCount || 0}</Text>次
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PatientCard;
