import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import FollowupCard from '@/components/FollowupCard';
import { useClinicStore, isNoShowResolved } from '@/store/clinicStore';
import { formatDate } from '@/utils/date';
import type { FollowupStatus } from '@/types';

type TabType = 'confirmed' | 'unconfirmed' | 'no_show';

const TodayPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState<TabType>('confirmed');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const getFollowupsByDate = useClinicStore(state => state.getFollowupsByDate);
  const doctorProfile = useClinicStore(state => state.doctorProfile);
  
  const dateStr = formatDate(currentDate.toDate());
  const displayDate = `${currentDate.format('M月D日')} ${formatDate(currentDate.toDate(), 'ddd')}`;

  const todayFollowups = useMemo(() => getFollowupsByDate(dateStr), [getFollowupsByDate, dateStr]);

  const stats = useMemo(() => {
    const total = todayFollowups.length;
    const confirmed = todayFollowups.filter(f => f.status === 'scheduled_confirmed').length;
    const unconfirmed = todayFollowups.filter(f => f.status === 'scheduled_unconfirmed').length;
    const pending = todayFollowups.filter(f => f.status === 'pending_schedule').length;
    const completed = todayFollowups.filter(f => f.status === 'completed').length;
    const noShow = todayFollowups.filter(f => f.status === 'no_show' && !isNoShowResolved(f)).length;
    return { total, confirmed, unconfirmed, pending, completed, noShow };
  }, [todayFollowups]);

  const filteredList = useMemo(() => {
    const statusMap: Record<TabType, FollowupStatus[]> = {
      confirmed: ['scheduled_confirmed'],
      unconfirmed: ['scheduled_unconfirmed', 'pending_schedule'],
      no_show: ['no_show'],
    };
    return todayFollowups
      .filter(f => statusMap[activeTab].includes(f.status) && !(f.status === 'no_show' && isNoShowResolved(f)))
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
  }, [todayFollowups, activeTab]);

  const groupedByTime = useMemo(() => {
    const morning = filteredList.filter(f => {
      const h = parseInt(f.scheduledTime?.split(':')[0] || '0');
      return h < 12;
    });
    const afternoon = filteredList.filter(f => {
      const h = parseInt(f.scheduledTime?.split(':')[0] || '0');
      return h >= 12;
    });
    return { morning, afternoon };
  }, [filteredList]);

  const urgentItems = useMemo(() => 
    filteredList.filter(f => f.urgency === 'urgent'), 
    [filteredList]
  );

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success', duration: 1500 });
    }, 800);
  });

  const changeDate = (offset: number) => {
    setCurrentDate(currentDate.add(offset, 'day'));
    console.log('[Today] 日期切换:', formatDate(currentDate.add(offset, 'day').toDate()));
  };

  const getGreeting = () => {
    const h = dayjs().hour();
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  };

  const goToNoShowPage = () => {
    Taro.navigateTo({ url: '/pages/noShowFollowup/index' });
  };

  const handleFabClick = () => {
    Taro.switchTab({ url: '/pages/patients/index' });
  };

  const tabs = [
    { key: 'confirmed' as TabType, label: '已确认', count: stats.confirmed },
    { key: 'unconfirmed' as TabType, label: '待确认', count: stats.unconfirmed + stats.pending, badge: stats.unconfirmed + stats.pending > 0 },
    { key: 'no_show' as TabType, label: '已爽约', count: stats.noShow, badge: stats.noShow > 0 },
  ];

  return (
    <ScrollView className={styles.pageWrapper} scrollY refresherEnabled refresherTriggered={isRefreshing}>
      <View className={styles.header}>
        <View className={styles.greetingRow}>
          <View className={styles.greetingLeft}>
            <Text className={styles.greeting}>{getGreeting()}，{doctorProfile.name}医生</Text>
            <Text className={styles.dateText}>今天是 {displayDate}，祝您工作顺利</Text>
          </View>
          <View className={styles.dateSwitcher}>
            <View className={styles.switchBtn} onClick={() => changeDate(-1)}>‹</View>
            <Text className={styles.currentDate}>{displayDate}</Text>
            <View className={styles.switchBtn} onClick={() => changeDate(1)}>›</View>
          </View>
        </View>

        <View className={styles.statsGrid}>
          <View className={styles.statItem} onClick={() => setActiveTab('confirmed')}>
            <Text className={styles.statValue}>{stats.confirmed}</Text>
            <Text className={styles.statLabel}>已确认</Text>
          </View>
          <View className={styles.statItem} onClick={() => setActiveTab('unconfirmed')}>
            <Text className={styles.statValue}>{stats.unconfirmed}</Text>
            <Text className={styles.statLabel}>待确认</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总预约</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem} onClick={() => setActiveTab('no_show')}>
            <Text className={styles.statValue}>{stats.noShow}</Text>
            <Text className={styles.statLabel}>爽约</Text>
          </View>
        </View>
      </View>

      <View className={styles.contentArea}>
        <View className={styles.tabBar}>
          {tabs.map(tab => (
            <View 
              key={tab.key}
              className={styles.tabItem + (activeTab === tab.key ? ' ' + styles.active : '')}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabText}>{tab.label}</Text>
              {tab.badge && tab.count > 0 && (
                <View className={styles.tabBadge}>{tab.count}</View>
              )}
            </View>
          ))}
        </View>

        {urgentItems.length > 0 && activeTab !== 'no_show' && (
          <View className={styles.urgentBanner}>
            <Text className={styles.bannerIcon}>🚨</Text>
            <View className={styles.bannerContent}>
              <Text className={styles.bannerTitle}>有{urgentItems.length}位紧急复诊需要关注</Text>
              <Text className={styles.bannerDesc}>
                {urgentItems.slice(0, 2).map((item, i) => {
                  const p = useClinicStore.getState().getPatientById(item.patientId);
                  return `${i > 0 ? '、' : ''}${p?.name || '未知'}: ${item.doctorNote?.slice(0, 15)}...`;
                }).join('')}
              </Text>
              <View className={styles.bannerAction} onClick={() => {}}>
                <Text className={styles.bannerActionText}>查看详情 →</Text>
              </View>
            </View>
          </View>
        )}

        <View className={styles.listArea}>
          {filteredList.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📅</Text>
              <Text className={styles.emptyText}>
                {activeTab === 'confirmed' ? '今天暂无已确认的预约' :
                 activeTab === 'unconfirmed' ? '今天没有待确认的预约' :
                 '今天没有爽约记录'}
                {'\n'}合理安排时间，保持工作节奏
              </Text>
            </View>
          ) : (
            <View className={styles.timelineWrapper}>
              {groupedByTime.morning.length > 0 && (
                <View className={styles.timeSection}>
                  <View className={styles.timeSectionHeader}>
                    <Text className={styles.timeSectionTitle}>🌅 上午</Text>
                    <Text className={styles.timeSectionCount}>{groupedByTime.morning.length}位患者</Text>
                  </View>
                  {groupedByTime.morning.map(item => (
                    <FollowupCard key={item.id} followup={item} variant="timeline" />
                  ))}
                </View>
              )}
              
              {groupedByTime.afternoon.length > 0 && (
                <View className={styles.timeSection}>
                  <View className={styles.timeSectionHeader}>
                    <Text className={styles.timeSectionTitle}>🌆 下午</Text>
                    <Text className={styles.timeSectionCount}>{groupedByTime.afternoon.length}位患者</Text>
                  </View>
                  {groupedByTime.afternoon.map(item => (
                    <FollowupCard key={item.id} followup={item} variant="timeline" />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <SectionHeader title="快捷入口" />
        <View style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24rpx', marginBottom: '48rpx' }}>
          <StatCard 
            label="查看全部复诊待办" 
            value="待办" 
            type="info"
            onClick={() => Taro.switchTab({ url: '/pages/followups/index' })}
            subText="点击进入"
          />
          <StatCard 
            label="爽约患者跟进" 
            value={stats.noShow || 0} 
            type="error"
            onClick={goToNoShowPage}
            subText={stats.noShow > 0 ? '查看跟进结果' : '暂无爽约'}
          />
        </View>
      </View>

      <View className={styles.fabButton} onClick={handleFabClick}>
        <Text className={styles.fabIcon}>+</Text>
        <Text className={styles.fabLabel}>安排复诊</Text>
      </View>
    </ScrollView>
  );
};

export default TodayPage;
