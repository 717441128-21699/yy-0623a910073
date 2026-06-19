import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getStatusInfo, getUrgencyColor } from '@/data/followups';
import type { FollowupStatus, FollowupUrgency } from '@/types';

interface StatusBadgeProps {
  type: 'status' | 'urgency';
  value: FollowupStatus | FollowupUrgency;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'md' }) => {
  const info = type === 'status' ? getStatusInfo(value as FollowupStatus) : getUrgencyColor(value as FollowupUrgency);
  
  return (
    <View className={classnames(styles.badge, styles[size])} style={{ backgroundColor: info.bg, color: info.text }}>
      <Text className={styles.text}>{info.label}</Text>
    </View>
  );
};

export default StatusBadge;
