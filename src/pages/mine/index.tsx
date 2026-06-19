import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useClinicStore, isNoShowResolved } from '@/store/clinicStore';

interface MenuItemConfig {
  icon: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  badge?: number | string;
  onClick?: () => void;
}

const MinePage: React.FC = () => {
  const doctorProfile = useClinicStore(state => state.doctorProfile);
  const patients = useClinicStore(state => state.patients);
  const followups = useClinicStore(state => state.followups);

  const overallStats = useMemo(() => {
    const thisMonth = dayjs().startOf('month');
    const monthCompleted = followups.filter(f => {
      const d = f.scheduledDate || f.suggestedDate;
      return dayjs(d).isAfter(thisMonth) && f.status === 'completed';
    }).length;
    const pendingSchedule = followups.filter(f => f.status === 'pending_schedule').length;
    const noShowCount = followups.filter(f => f.status === 'no_show' && !isNoShowResolved(f)).length;
    const urgentPending = followups.filter(f => 
      f.urgency === 'urgent' && f.status !== 'completed' && f.status !== 'cancelled' && !(f.status === 'no_show' && isNoShowResolved(f))
    ).length;

    return {
      totalPatients: patients.length,
      monthCompleted,
      pendingSchedule,
      noShowCount,
      urgentPending,
    };
  }, [followups, patients]);

  const handleMenuItemClick = (action: string) => {
    console.log('[Mine] 点击菜单项:', action);
    switch (action) {
      case 'schedule_template':
        Taro.showToast({ title: '预约模板开发中', icon: 'none' });
        break;
      case 'followup_report':
        Taro.showToast({ title: '复诊统计开发中', icon: 'none' });
        break;
      case 'no_show_list':
        Taro.navigateTo({ url: '/pages/noShowFollowup/index' });
        break;
      case 'treatment_config':
        Taro.showToast({ title: '治疗项目配置开发中', icon: 'none' });
        break;
      case 'reminder_settings':
        Taro.showToast({ title: '提醒设置开发中', icon: 'none' });
        break;
      case 'data_sync':
        Taro.showToast({ title: '同步中...', icon: 'loading', duration: 1500 });
        break;
      case 'help':
        Taro.showToast({ title: '帮助中心开发中', icon: 'none' });
        break;
      case 'about':
        Taro.showToast({ title: '口腔复诊助手 v1.0.0', icon: 'none' });
        break;
      case 'settings':
        Taro.showToast({ title: '设置开发中', icon: 'none' });
        break;
      default:
        break;
    }
  };

  const menuGroups: { title: string; items: MenuItemConfig[] }[] = [
    {
      title: '业务管理',
      items: [
        {
          icon: '📋',
          iconBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
          title: '预约模板管理',
          subtitle: '自定义复诊间隔、目的等快捷选项',
          onClick: () => handleMenuItemClick('schedule_template'),
        },
        {
          icon: '📊',
          iconBg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
          title: '复诊数据统计',
          subtitle: `本月已完成 ${overallStats.monthCompleted} 次复诊`,
          onClick: () => handleMenuItemClick('followup_report'),
        },
        {
          icon: '📞',
          iconBg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          title: '爽约跟进记录',
          subtitle: '查看前台跟进结果，决定追访策略',
          badge: overallStats.noShowCount,
          onClick: () => handleMenuItemClick('no_show_list'),
        },
      ],
    },
    {
      title: '个性化配置',
      items: [
        {
          icon: '🦷',
          iconBg: 'linear-gradient(135deg, #E6F7F7 0%, #D0EFEF 100%)',
          title: '治疗项目配置',
          subtitle: '补牙、根管、种植等项目自定义',
          onClick: () => handleMenuItemClick('treatment_config'),
        },
        {
          icon: '🔔',
          iconBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          title: '提醒设置',
          subtitle: '复诊提醒、待办通知推送方式',
          onClick: () => handleMenuItemClick('reminder_settings'),
        },
        {
          icon: '☁️',
          iconBg: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
          title: '数据同步',
          subtitle: `最后同步: ${dayjs().format('HH:mm')}`,
          onClick: () => handleMenuItemClick('data_sync'),
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          icon: '❓',
          iconBg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
          title: '使用帮助',
          subtitle: '常见问题、操作视频',
          onClick: () => handleMenuItemClick('help'),
        },
        {
          icon: 'ℹ️',
          iconBg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
          title: '关于',
          subtitle: '版本信息、隐私政策',
          onClick: () => handleMenuItemClick('about'),
        },
      ],
    },
  ];

  return (
    <ScrollView className={styles.pageWrapper} scrollY>
      <View className={styles.profileHeader}>
        <View className={styles.decorCircle1} />
        <View className={styles.decorCircle2} />

        <View className={styles.profileCard}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>{doctorProfile.name.charAt(0)}</Text>
          </View>
          <View className={styles.profileInfo}>
            <Text className={styles.doctorName}>{doctorProfile.name}</Text>
            <Text className={styles.doctorTitle}>{doctorProfile.title} · {doctorProfile.department}</Text>
            <Text className={styles.clinicName}>
              <Text className={styles.clinicIcon}>🏥</Text>
              {doctorProfile.clinic}
            </Text>
          </View>
          <View className={styles.settingBtn} onClick={() => handleMenuItemClick('settings')}>
            <Text className={styles.settingIcon}>⚙️</Text>
          </View>
        </View>

        <View className={styles.statsArea}>
          <View className={styles.statsGrid}>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{overallStats.totalPatients}</Text>
              <Text className={styles.statsLabel}>累计患者</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#059669' }}>{overallStats.monthCompleted}</Text>
              <Text className={styles.statsLabel}>本月完成</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#D97706' }}>{overallStats.pendingSchedule}</Text>
              <Text className={styles.statsLabel}>待安排</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue} style={{ color: '#DC2626' }}>{overallStats.urgentPending}</Text>
              <Text className={styles.statsLabel}>紧急待办</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.contentArea}>
        {menuGroups.map((group, gIdx) => (
          <View key={gIdx}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionTitleBar} />
              {group.title}
            </View>
            <View className={styles.menuCard}>
              {group.items.map((item, iIdx) => (
                <View 
                  key={iIdx} 
                  className={styles.menuItem} 
                  onClick={item.onClick}
                >
                  <View className={styles.menuIcon} style={{ background: item.iconBg }}>
                    {item.icon}
                  </View>
                  <View className={styles.menuContent}>
                    <Text className={styles.menuTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text className={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  <View className={styles.menuRight}>
                    {item.badge && (
                      <View className={styles.menuBadge}>{item.badge}</View>
                    )}
                    <Text className={styles.menuArrow}>›</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View className={styles.aboutCard}>
          <Text className={styles.aboutText}>
            <Text className={styles.aboutHighlight}>口腔复诊助手</Text> {'\n'}
            让每一次复诊都不被遗漏
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
