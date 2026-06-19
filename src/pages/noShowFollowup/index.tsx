import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useClinicStore } from '@/store/clinicStore';
import { formatDateTime } from '@/utils/date';
import type { FollowupRecord, FollowupAttempt } from '@/types';

type FilterType = 'all' | 'pending' | 'followed' | 'resolved';

const getMethodLabel = (m: FollowupAttempt['method']) => ({ phone: '电话', wechat: '微信', sms: '短信' })[m] || m;
const getMethodIcon = (m: FollowupAttempt['method']) => ({ phone: '📞', wechat: '💬', sms: '📱' })[m] || '📋';

const getResultInfo = (result: FollowupAttempt['result']) => {
  const map = {
    connected: { label: '已接通', cls: styles.attemptResultConnected },
    no_answer: { label: '未接听', cls: styles.attemptResultNoAnswer },
    busy: { label: '占线', cls: styles.attemptResultBusy },
    rescheduled: { label: '改期成功', cls: styles.attemptResultRescheduled },
    refused: { label: '拒绝复诊', cls: styles.attemptResultRefused },
  };
  return map[result] || { label: result, cls: '' };
};

const NoShowFollowupPage: React.FC = () => {
  const router = useRouter();
  const singleId = router.params.id as string | undefined;
  const [filterType, setFilterType] = useState<FilterType>(singleId ? 'all' : 'pending');
  
  const followups = useClinicStore(state => state.followups);
  const getPatientById = useClinicStore(state => state.getPatientById);
  const resolveNoShow = useClinicStore(state => state.resolveNoShow);

  const noShowFollowups = useMemo(() => 
    followups.filter(f => f.status === 'no_show'),
    [followups]
  );

  const filteredList = useMemo(() => {
    let list = [...noShowFollowups];
    
    if (singleId) {
      list = list.filter(f => f.id === singleId);
    } else {
      switch (filterType) {
        case 'pending':
          list = list.filter(f => !f.nextAction && (f.followupAttempts || []).length < 3);
          break;
        case 'followed':
          list = list.filter(f => (f.followupAttempts || []).length >= 1);
          break;
        case 'resolved':
          list = list.filter(f => !!f.nextAction);
          break;
      }
    }
    
    return list.sort((a, b) => {
      const attemptsA = a.followupAttempts || [];
      const attemptsB = b.followupAttempts || [];
      if (attemptsA.length !== attemptsB.length) {
        return attemptsA.length - attemptsB.length;
      }
      return dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf();
    });
  }, [noShowFollowups, filterType, singleId]);

  const stats = useMemo(() => {
    const total = noShowFollowups.length;
    const pending = noShowFollowups.filter(f => !f.nextAction && (f.followupAttempts || []).length < 3).length;
    const resolved = noShowFollowups.filter(f => !!f.nextAction).length;
    const totalAttempts = noShowFollowups.reduce((sum, f) => sum + (f.followupAttempts || []).length, 0);
    return { total, pending, resolved, totalAttempts };
  }, [noShowFollowups]);

  const filterTabs = [
    { key: 'all' as FilterType, label: '全部', count: stats.total },
    { key: 'pending' as FilterType, label: '待跟进', count: stats.pending, badge: stats.pending > 0 },
    { key: 'followed' as FilterType, label: '跟进中', count: stats.total - stats.pending - stats.resolved },
    { key: 'resolved' as FilterType, label: '已处理', count: stats.resolved },
  ];

  const handleCall = (phone: string) => {
    console.log('[NoShowFollowup] 拨打电话:', phone);
    Taro.showToast({ title: `拨打 ${phone}`, icon: 'none' });
  };

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/followupDetail/index?id=${id}` });
  };

  const handleReschedule = (followup: FollowupRecord) => {
    const patient = getPatientById(followup.patientId);
    if (!patient) return;
    Taro.showModal({
      title: '重新安排',
      content: `是否为${patient.name}重新安排${followup.treatmentTypeName}复诊？旧爽约记录将被标记为"已重新安排"`,
      confirmText: '重新安排',
      confirmColor: '#0FA5A5',
      success: (res) => {
        if (res.confirm) {
          resolveNoShow(followup.id, 'reschedule', '将重新安排复诊时间');
          Taro.navigateTo({ url: `/pages/scheduleFollowup/index?patientId=${followup.patientId}&replaceFollowupId=${followup.id}` });
        }
      },
    });
  };

  const handleRemindKeyPoint = (followup: FollowupRecord) => {
    const patient = getPatientById(followup.patientId);
    if (!patient) return;
    Taro.showModal({
      title: '添加重点标记',
      content: `下次${patient.name}就诊时，将重点提示：${followup.doctorNote || followup.treatmentTypeName}`,
      confirmText: '添加标记',
      confirmColor: '#F59E0B',
      success: (res) => {
        if (res.confirm) {
          resolveNoShow(followup.id, 'mark_important', followup.doctorNote || followup.treatmentTypeName);
          Taro.showToast({ title: '已添加重点标记', icon: 'success' });
        }
      },
    });
  };

  const handleStopFollowup = (followup: FollowupRecord) => {
    const patient = getPatientById(followup.patientId);
    if (!patient) return;
    Taro.showModal({
      title: '停止追访',
      content: `确认停止对${patient.name}的追访？该患者将进入低优先级`,
      confirmText: '停止追访',
      confirmColor: '#DC2626',
      success: (res) => {
        if (res.confirm) {
          resolveNoShow(followup.id, 'stop_followup', '停止追访，转低优先级关注');
          Taro.showToast({ title: '已停止追访', icon: 'none' });
        }
      },
    });
  };

  const goToPatient = (patientId: string) => {
    Taro.navigateTo({ url: `/pages/patientDetail/index?id=${patientId}` });
  };

  return (
    <ScrollView className={styles.pageWrapper} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>患者爽约跟进</Text>
        <Text className={styles.headerSubtitle}>查看前台跟进结果，决定追访策略</Text>
        
        <View className={styles.statsRow}>
          <View className={styles.statCol}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>爽约总数</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statValue}>{stats.totalAttempts}</Text>
            <Text className={styles.statLabel}>联系次数</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statValue} style={{ color: '#FEF3C7' }}>{stats.resolved}</Text>
            <Text className={styles.statLabel}>已处理</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {!singleId && (
          <View className={styles.filterTabs}>
            {filterTabs.map(tab => (
              <View 
                key={tab.key}
                className={classnames(styles.filterTab, filterType === tab.key && styles.active)}
                onClick={() => setFilterType(tab.key)}
              >
                <Text className={styles.filterTabText}>{tab.label}</Text>
                {tab.count > 0 && (
                  <View className={styles.filterTabBadge}>{tab.count}</View>
                )}
              </View>
            ))}
          </View>
        )}

        <View className={styles.listArea}>
          {filteredList.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🎉</Text>
              <Text className={styles.emptyTitle}>
                {filterType === 'resolved' ? '暂无已处理的爽约' :
                 filterType === 'pending' ? '暂无待跟进的爽约' :
                 filterType === 'followed' ? '暂无跟进中记录' :
                 '暂无爽约记录'}
              </Text>
              <Text className={styles.emptyDesc}>
                {filterType === 'all' ? '没有患者爽约，工作超顺利！' : '切换筛选条件查看其他记录'}
              </Text>
            </View>
          ) : (
            filteredList.map(followup => {
              const patient = getPatientById(followup.patientId);
              const attempts = [...(followup.followupAttempts || [])].sort((a, b) => 
                dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
              );
              const lastConnected = attempts.find(a => a.result === 'connected' || a.result === 'rescheduled');
              
              return patient ? (
                <View key={followup.id} className={styles.followupCard}>
                  <View className={styles.cardHeader}>
                    <View className={styles.patientAvatar} onClick={() => goToPatient(patient.id)}>
                      <Text className={styles.avatarText}>{patient.name.charAt(0)}</Text>
                    </View>
                    <View className={styles.patientInfo}>
                      <View className={styles.patientRow1}>
                        <Text className={styles.patientName} onClick={() => goToPatient(patient.id)}>
                          {patient.name}
                        </Text>
                        <Text className={styles.patientGenderAge}>
                          {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁
                        </Text>
                      </View>
                      <View className={styles.patientPhoneRow} onClick={() => handleCall(patient.phone)}>
                        <Text className={styles.phoneText}>📞 {patient.phone}</Text>
                      </View>
                      <View className={styles.treatmentTag}>
                        <Text className={styles.treatmentTagText}>{followup.treatmentTypeName}</Text>
                      </View>
                    </View>
                  </View>

                  <View className={styles.tagsRow}>
                    <View className={styles.infoTag}>
                      <Text className={styles.infoTagIcon}>📅</Text>
                      <Text className={styles.infoTagText}>
                        原预约: {followup.scheduledDate} {followup.scheduledTime}
                      </Text>
                    </View>
                    <View className={styles.infoTag}>
                      <Text className={styles.infoTagIcon}>📞</Text>
                      <Text className={styles.infoTagText}>
                        已联系{attempts.length}次
                      </Text>
                    </View>
                    {lastConnected && (
                      <View className={styles.infoTag}>
                        <Text className={styles.infoTagIcon}>✅</Text>
                        <Text className={styles.infoTagText}>
                          已联系到: {dayjs(lastConnected.time).format('M月D日')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className={styles.appointmentInfo}>
                    <View className={styles.appointmentRow}>
                      <Text className={styles.appointmentLabel}>复诊目的</Text>
                      <Text className={styles.appointmentValue}>{followup.purpose}</Text>
                    </View>
                    {followup.doctorNote && (
                      <View className={styles.appointmentRow}>
                        <Text className={styles.appointmentLabel}>医生备注</Text>
                        <Text className={classnames(styles.appointmentValue, styles.appointmentValueHighlight)}>
                          {followup.doctorNote}
                        </Text>
                      </View>
                    )}
                    {followup.frontDeskNote && (
                      <View className={styles.appointmentRow}>
                        <Text className={styles.appointmentLabel}>前台反馈</Text>
                        <Text className={styles.appointmentValue}>{followup.frontDeskNote}</Text>
                      </View>
                    )}
                  </View>

                  {attempts.length > 0 && (
                    <View className={styles.attemptSection}>
                      <Text className={styles.attemptTitle}>📞 跟进记录 ({attempts.length})</Text>
                      <View className={styles.attemptList}>
                        {attempts.slice(0, 3).map(attempt => {
                          const resultInfo = getResultInfo(attempt.result);
                          return (
                            <View key={attempt.id} className={styles.attemptItem}>
                              <View className={styles.attemptIcon}>{getMethodIcon(attempt.method)}</View>
                              <View className={styles.attemptBody}>
                                <View className={styles.attemptMeta}>
                                  <View>
                                    <Text className={classnames(styles.attemptResult, resultInfo.cls)}>
                                      {resultInfo.label}
                                    </Text>
                                    <Text style={{ fontSize: 20, color: '#6B7280' }}>
                                      {getMethodLabel(attempt.method)} · {attempt.operator}
                                    </Text>
                                  </View>
                                  <Text className={styles.attemptTime}>{formatDateTime(attempt.time)}</Text>
                                </View>
                                {attempt.note && (
                                  <Text className={styles.attemptNote}>"{attempt.note}"</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {followup.nextAction && (
                    <View className={styles.nextActionBlock}>
                      <Text className={styles.nextActionTitle}>📍 已决定处理策略</Text>
                      <Text className={styles.nextActionText}>{followup.nextAction}</Text>
                    </View>
                  )}

                  {!followup.nextAction && (
                    <>
                      <Text className={styles.attemptTitle}>👨‍⚕️ 医生决策：我决定...</Text>
                      <View className={styles.decisionRow}>
                        <View 
                          className={classnames(styles.decisionBtn, styles.decisionBtnPrimary)}
                          onClick={() => handleReschedule(followup)}
                        >
                          <Text className={styles.decisionBtnIcon}>📅</Text>
                          <Text className={styles.decisionBtnText}>重新安排</Text>
                          <Text className={styles.decisionBtnText} style={{ fontWeight: 400, color: '#6B7280', fontSize: 18 }}>预约新时间</Text>
                        </View>
                        <View 
                          className={classnames(styles.decisionBtn, styles.decisionBtnWarning)}
                          onClick={() => handleRemindKeyPoint(followup)}
                        >
                          <Text className={styles.decisionBtnIcon}>📌</Text>
                          <Text className={styles.decisionBtnText}>重点标记</Text>
                          <Text className={styles.decisionBtnText} style={{ fontWeight: 400, color: '#6B7280', fontSize: 18 }}>下次重点沟通</Text>
                        </View>
                        <View 
                          className={classnames(styles.decisionBtn, styles.decisionBtnDanger)}
                          onClick={() => handleStopFollowup(followup)}
                        >
                          <Text className={styles.decisionBtnIcon}>✋</Text>
                          <Text className={styles.decisionBtnText}>停止追访</Text>
                          <Text className={styles.decisionBtnText} style={{ fontWeight: 400, color: '#6B7280', fontSize: 18 }}>低优先级关注</Text>
                        </View>
                      </View>
                    </>
                  )}

                  <View className={styles.cardActionRow}>
                    <View className={styles.cardBtn} onClick={() => handleCall(patient.phone)}>
                      <Text className={styles.cardBtnText}>📞 联系患者</Text>
                    </View>
                    <View className={styles.cardBtn} onClick={() => goToPatient(patient.id)}>
                      <Text className={styles.cardBtnText}>📁 患者档案</Text>
                    </View>
                    <View 
                      className={classnames(styles.cardBtn, styles.cardBtnPrimary)} 
                      onClick={() => handleViewDetail(followup.id)}
                    >
                      <Text className={styles.cardBtnText}>查看详情 ›</Text>
                    </View>
                  </View>
                </View>
              ) : null;
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default NoShowFollowupPage;
