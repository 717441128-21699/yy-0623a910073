import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import PatientCard from '@/components/PatientCard';
import { useClinicStore } from '@/store/clinicStore';
import type { Patient } from '@/types';

type FilterType = 'all' | 'vip' | 'elderly' | 'surgery' | 'orthodontic';

const PatientsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const patients = useClinicStore(state => state.patients);
  const searchPatients = useClinicStore(state => state.searchPatients);
  const getFollowupsByPatientId = useClinicStore(state => state.getFollowupsByPatientId);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 600);
  });

  const stats = useMemo(() => {
    const total = patients.length;
    const vip = patients.filter(p => p.tags?.includes('VIP')).length;
    const elderly = patients.filter(p => p.age >= 60).length;
    const recent = patients.filter(p => {
      const history = getFollowupsByPatientId(p.id);
      return history.some(f => dayjs(f.createTime).isAfter(dayjs().subtract(30, 'day')));
    }).length;
    return { total, vip, elderly, recent };
  }, [patients, getFollowupsByPatientId]);

  const filters = [
    { key: 'all' as FilterType, label: '全部患者' },
    { key: 'vip' as FilterType, label: 'VIP患者' },
    { key: 'elderly' as FilterType, label: '老年患者' },
    { key: 'surgery' as FilterType, label: '种植/手术' },
    { key: 'orthodontic' as FilterType, label: '正畸中' },
  ];

  const filteredPatients = useMemo(() => {
    let list = searchText.trim() ? searchPatients(searchText.trim()) : [...patients];
    
    switch (filterType) {
      case 'vip':
        list = list.filter(p => p.tags?.includes('VIP'));
        break;
      case 'elderly':
        list = list.filter(p => p.age >= 60);
        break;
      case 'surgery':
        list = list.filter(p => 
          p.tags?.includes('种植患者') || 
          p.visitHistory.some(v => v.treatment.includes('种植') || v.treatment.includes('拔除'))
        );
        break;
      case 'orthodontic':
        list = list.filter(p => p.tags?.includes('正畸') || p.tags?.includes('正畸中'));
        break;
    }
    
    list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    
    return list;
  }, [patients, searchText, filterType, searchPatients]);

  const groupedByLetter = useMemo(() => {
    const groups: Record<string, Patient[]> = {};
    filteredPatients.forEach(p => {
      const firstChar = p.name.charAt(0);
      const letter = firstChar.toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(p);
    });
    const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    return { groups, keys };
  }, [filteredPatients]);

  const handleQuickAction = (patientId: string) => {
    Taro.navigateTo({
      url: `/pages/scheduleFollowup/index?patientId=${patientId}`,
    });
  };

  const handleAddPatient = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1500,
    });
  };

  const handleFilterClick = (key: FilterType) => {
    setFilterType(key);
    console.log('[Patients] 筛选条件变更:', key);
  };

  return (
    <ScrollView className={styles.pageWrapper} scrollY refresherEnabled refresherTriggered={isRefreshing}>
      <View className={styles.headerArea}>
        <Text className={styles.headerTitle}>患者管理</Text>
        <Text className={styles.headerSubtitle}>管理您的所有患者，快速安排复诊</Text>
        
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索姓名/病历号/手机号"
            placeholderClass={styles.searchPlaceholder as any}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.contentArea}>
        <View className={styles.quickStats}>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatIcon}>👥</Text>
            <Text className={styles.quickStatValue}>{stats.total}</Text>
            <Text className={styles.quickStatLabel}>总患者</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatIcon}>⭐</Text>
            <Text className={styles.quickStatValue}>{stats.vip}</Text>
            <Text className={styles.quickStatLabel}>VIP</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatIcon}>👴</Text>
            <Text className={styles.quickStatValue}>{stats.elderly}</Text>
            <Text className={styles.quickStatLabel}>老年</Text>
          </View>
          <View className={styles.quickStatItem}>
            <Text className={styles.quickStatIcon}>📅</Text>
            <Text className={styles.quickStatValue}>{stats.recent}</Text>
            <Text className={styles.quickStatLabel}>近期活跃</Text>
          </View>
        </View>

        <View className={styles.filterBar}>
          <ScrollView scrollX className={styles.filterLeft} showScrollbar={false}>
            {filters.map(f => (
              <View
                key={f.key}
                className={classnames(styles.filterChip, filterType === f.key && styles.active)}
                onClick={() => handleFilterClick(f.key)}
              >
                <Text className={styles.filterChipText}>{f.label}</Text>
              </View>
            ))}
          </ScrollView>
          <View className={styles.filterRight}>
            <Text className={styles.filterSortText}>A-Z</Text>
            <Text>🔤</Text>
          </View>
        </View>

        <View className={styles.patientList}>
          {filteredPatients.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🧑‍⚕️</Text>
              <Text className={styles.emptyTitle}>暂无匹配的患者</Text>
              <Text className={styles.emptyDesc}>
                {searchText ? '没有找到匹配的患者信息' : '当前筛选条件下没有患者'}
                {'\n'}试试其他关键词或筛选条件
              </Text>
            </View>
          ) : (
            groupedByLetter.keys.map(letter => (
              <View key={letter}>
                <View className={styles.listLetterHeader}>
                  <View className={styles.letterBadge}>
                    <Text className={styles.letterText}>{letter}</Text>
                  </View>
                  <Text className={styles.letterCount}>{groupedByLetter.groups[letter].length}位患者</Text>
                </View>
                {groupedByLetter.groups[letter].map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    showDetails
                    actionLabel="安排复诊"
                    onAction={() => handleQuickAction(patient.id)}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </View>

      <View className={styles.addPatientBtn} onClick={handleAddPatient}>
        <Text className={styles.addPatientIcon}>+</Text>
        <Text className={styles.addPatientLabel}>新增患者</Text>
      </View>
    </ScrollView>
  );
};

export default PatientsPage;
