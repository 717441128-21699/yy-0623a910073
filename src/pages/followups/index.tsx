import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import FollowupCard from '@/components/FollowupCard';
import { useClinicStore, isNoShowResolved } from '@/store/clinicStore';
import { isThisWeek, isNextWeek, formatDate, getRelativeDateLabel, getWeekday, isPast } from '@/utils/date';
import type { FollowupRecord } from '@/types';

type DateFilterType = 'all' | 'today' | 'this_week' | 'next_week' | 'this_month' | 'overdue' | 'pending';
type SortType = 'date_asc' | 'date_desc' | 'urgency';

const TodayPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_week');
  const [sortType, setSortType] = useState<SortType>('date_asc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const followups = useClinicStore(state => state.followups);
  const searchPatients = useClinicStore(state => state.searchPatients);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 600);
  });

  const activeFollowups = useMemo(() => 
    followups.filter(f => f.status !== 'completed' && f.status !== 'cancelled' && !(f.status === 'no_show' && isNoShowResolved(f))),
    [followups]
  );

  const overviewStats = useMemo(() => {
    let overdue = 0;
    let thisWeek = 0;
    let nextWeek = 0;
    
    activeFollowups.forEach(f => {
      const d = f.scheduledDate || f.suggestedDate;
      if (isPast(d) && f.status !== 'completed' && f.status !== 'no_show') {
        overdue++;
      }
      if (isThisWeek(d)) thisWeek++;
      if (isNextWeek(d)) nextWeek++;
    });
    
    return { overdue, thisWeek, nextWeek, pending: activeFollowups.filter(f => f.status === 'pending_schedule').length };
  }, [activeFollowups]);

  const dateFilters = [
    { key: 'all' as DateFilterType, label: '全部', count: activeFollowups.length },
    { key: 'today' as DateFilterType, label: '今天', count: activeFollowups.filter(f => formatDate(dayjs().toDate()) === (f.scheduledDate || f.suggestedDate)).length },
    { key: 'this_week' as DateFilterType, label: '本周内', count: overviewStats.thisWeek },
    { key: 'next_week' as DateFilterType, label: '下周内', count: overviewStats.nextWeek },
    { key: 'overdue' as DateFilterType, label: '已逾期', count: overviewStats.overdue },
    { key: 'pending' as DateFilterType, label: '待安排', count: overviewStats.pending },
  ];

  const filteredList = useMemo(() => {
    let list = [...activeFollowups];
    
    // 搜索过滤
    if (searchText.trim()) {
      const matchedPatientIds = searchPatients(searchText.trim()).map(p => p.id);
      list = list.filter(f => matchedPatientIds.includes(f.patientId));
    }
    
    // 日期过滤
    const today = dayjs();
    const fmt = 'YYYY-MM-DD';
    const todayStr = today.format(fmt);
    const weekStart = today.startOf('week').format(fmt);
    const weekEnd = today.endOf('week').format(fmt);
    const nextWeekStart = today.add(1, 'week').startOf('week').format(fmt);
    const nextWeekEnd = today.add(1, 'week').endOf('week').format(fmt);
    const monthEnd = today.endOf('month').format(fmt);
    
    list = list.filter(f => {
      const d = f.scheduledDate || f.suggestedDate;
      switch (dateFilter) {
        case 'today': return d === todayStr;
        case 'this_week': return d >= weekStart && d <= weekEnd;
        case 'next_week': return d >= nextWeekStart && d <= nextWeekEnd;
        case 'this_month': return d >= todayStr && d <= monthEnd;
        case 'overdue': return isPast(d) && f.status !== 'completed' && f.status !== 'no_show';
        case 'pending': return f.status === 'pending_schedule';
        default: return true;
      }
    });
    
    // 排序
    const urgencyRank: Record<string, number> = { urgent: 0, attention: 1, normal: 2 };
    list.sort((a, b) => {
      const dA = a.scheduledDate || a.suggestedDate;
      const dB = b.scheduledDate || b.suggestedDate;
      switch (sortType) {
        case 'date_asc':
          return dA.localeCompare(dB);
        case 'date_desc':
          return dB.localeCompare(dA);
        case 'urgency':
          return urgencyRank[a.urgency] - urgencyRank[b.urgency] || dA.localeCompare(dB);
        default:
          return 0;
      }
    });
    
    return list;
  }, [activeFollowups, searchText, dateFilter, sortType, searchPatients]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, FollowupRecord[]> = {};
    filteredList.forEach(f => {
      const d = f.scheduledDate || f.suggestedDate;
      if (!groups[d]) groups[d] = [];
      groups[d].push(f);
    });
    const keys = Object.keys(groups).sort((a, b) => 
      sortType === 'date_desc' ? b.localeCompare(a) : a.localeCompare(b)
    );
    return { groups, keys };
  }, [filteredList, sortType]);

  const handlePatientListClick = () => {
    Taro.switchTab({ url: '/pages/patients/index' });
  };

  const formatGroupHeader = (dateStr: string) => {
    const relative = getRelativeDateLabel(dateStr);
    const weekday = getWeekday(dateStr);
    const isOverdue = isPast(dateStr) && !dayjs(dateStr).isSame(dayjs(), 'day');
    return {
      title: `${relative} · ${weekday} (${dayjs(dateStr).format('M月D日')})`,
      isOverdue,
    };
  };

  return (
    <ScrollView className={styles.pageWrapper} scrollY refresherEnabled refresherTriggered={isRefreshing}>
      <View className={styles.searchArea}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索患者姓名/病历号/手机号"
            placeholderClass={styles.searchPlaceholder as any}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
          {searchText && (
            <View className={styles.searchBtn} onClick={() => setSearchText('')}>
              <Text className={styles.searchBtnText}>清除</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.filterArea}>
        <ScrollView scrollX className={styles.chipScroll} showScrollbar={false}>
          {dateFilters.map(f => (
            <View
              key={f.key}
              className={classnames(styles.chip, dateFilter === f.key && styles.active)}
              onClick={() => setDateFilter(f.key)}
            >
              <Text className={styles.chipText}>{f.label}</Text>
              {f.count > 0 && (
                <View className={styles.chipCount}>{f.count}</View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.contentArea}>
        <View className={styles.overviewRow}>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{activeFollowups.length}</Text>
            <Text className={styles.overviewLabel}>全部待办</Text>
          </View>
          <View className={classnames(styles.overviewItem, styles.overdueColor)}>
            <Text className={styles.overviewValue}>{overviewStats.overdue}</Text>
            <Text className={styles.overviewLabel}>已逾期</Text>
          </View>
          <View className={classnames(styles.overviewItem, styles.attentionColor)}>
            <Text className={styles.overviewValue}>{overviewStats.pending}</Text>
            <Text className={styles.overviewLabel}>待前台安排</Text>
          </View>
        </View>

        <View className={styles.sortBar}>
          <Text className={styles.sortTitle}>
            共{filteredList.length}条记录
          </Text>
          <View className={styles.sortActions}>
            <View 
              className={classnames(styles.sortAction, sortType === 'date_asc' && styles.active)} 
              onClick={() => setSortType('date_asc')}
            >
              <Text className={styles.sortActionText}>时间正序</Text>
              <Text className={styles.sortActionIcon}>↑</Text>
            </View>
            <View 
              className={classnames(styles.sortAction, sortType === 'urgency' && styles.active)} 
              onClick={() => setSortType('urgency')}
            >
              <Text className={styles.sortActionText}>紧急优先</Text>
              <Text className={styles.sortActionIcon}>🔥</Text>
            </View>
          </View>
        </View>

        <View className={styles.listArea}>
          {filteredList.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyTitle}>暂无复诊待办</Text>
              <Text className={styles.emptyDesc}>
                {searchText ? '没有找到匹配的患者复诊记录' : '当前筛选条件下没有待办事项'}
                {'\n'}在患者结束诊疗时为TA安排下次复诊吧
              </Text>
              <View className={styles.emptyAction} onClick={handlePatientListClick}>
                <Text className={styles.emptyActionText}>去患者列表安排</Text>
              </View>
            </View>
          ) : (
            groupedByDate.keys.map(dateKey => {
              const header = formatGroupHeader(dateKey);
              const items = groupedByDate.groups[dateKey];
              return (
                <View key={dateKey}>
                  <View className={styles.dateGroupHeader}>
                    <View className={styles.dateGroupBar} 
                      style={header.isOverdue ? { background: 'linear-gradient(180deg, #EF4444 0%, #F87171 100%)' } : {}}
                    />
                    <Text className={styles.dateGroupText} 
                      style={header.isOverdue ? { color: '#EF4444' } : {}}
                    >
                      {header.isOverdue ? '⚠️ ' : ''}{header.title}
                    </Text>
                    <View className={styles.dateGroupCount}>{items.length}项</View>
                  </View>
                  <View className={styles.cardList}>
                    {items.map(item => (
                      <FollowupCard key={item.id} followup={item} variant="default" />
                    ))}
                  </View>
                  <View className={styles.sectionDivider} />
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default TodayPage;
