import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  extra?: React.ReactNode;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, extra, subtitle }) => {
  return (
    <View className={styles.wrapper}>
      <View className={styles.left}>
        <View className={styles.titleBar} />
        <Text className={styles.title}>{title}</Text>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
      </View>
      {extra && <View className={styles.extra}>{extra}</View>}
    </View>
  );
};

export default SectionHeader;
