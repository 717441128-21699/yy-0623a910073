import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

type StatType = 'primary' | 'success' | 'warning' | 'error' | 'info';

interface StatCardProps {
  label: string;
  value: number | string;
  type?: StatType;
  onClick?: () => void;
  subText?: string;
}

const typeConfig: Record<StatType, { bg: string; valueColor: string; icon: string }> = {
  primary: { bg: 'linear-gradient(135deg, #E6F7F7 0%, #D0EFEF 100%)', valueColor: '#0A8585', icon: '📋' },
  success: { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', valueColor: '#059669', icon: '✅' },
  warning: { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', valueColor: '#D97706', icon: '⏰' },
  error: { bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', valueColor: '#DC2626', icon: '⚠️' },
  info: { bg: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', valueColor: '#0284C7', icon: '📊' },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, type = 'primary', onClick, subText }) => {
  const config = typeConfig[type];
  
  return (
    <View 
      className={classnames(styles.card, onClick && styles.clickable)} 
      style={{ background: config.bg }}
      onClick={onClick}
    >
      <View className={styles.iconRow}>
        <Text className={styles.icon}>{config.icon}</Text>
      </View>
      <Text className={styles.value} style={{ color: config.valueColor }}>{value}</Text>
      <Text className={styles.label}>{label}</Text>
      {subText && <Text className={styles.subText}>{subText}</Text>}
    </View>
  );
};

export default StatCard;
