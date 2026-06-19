import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useClinicStore, isNoShowResolved } from '@/store/clinicStore';
import type { FollowupStatus, FollowupAttempt, NoShowResolution } from '@/types';
import { getStatusInfo, getUrgencyColor } from '@/data/followups';
import { formatDateTime, getWeekday } from '@/utils/date';

const getHeaderClass = (status: FollowupStatus) => {
  switch (status) {
    case 'scheduled_confirmed': return styles.statusConfirmed;
    case 'pending_schedule': return styles.statusPending;
    case 'scheduled_unconfirmed': return styles.statusUnconfirmed;
    case 'no_show': return styles.statusNoShow;
    case 'completed': return styles.statusCompleted;
    default: return styles.statusOther;
  }
};

const getMethodLabel = (method: FollowupAttempt['method']) => {
  const map = { phone: '电话', wechat: '微信', sms: '短信' };
  return map[method] || method;
};

const getMethodIcon = (method: FollowupAttempt['method']) => {
  const map = { phone: '📞', wechat: '💬', sms: '📱' };
  return map[method] || '📋';
};

const getResultInfo = (result: FollowupAttempt['result']) => {
  const map = {
    connected: { label: '已接通', cls: styles.resultConnected },
    no_answer: { label: '未接听', cls: styles.resultNoAnswer },
    busy: { label: '占线', cls: styles.resultBusy },
    rescheduled: { label: '改期成功', cls: styles.resultRescheduled },
    refused: { label: '拒绝复诊', cls: styles.resultRefused },
  };
  return map[result] || { label: result, cls: '' };
};

const FollowupDetailPage: React.FC = () => {
  const router = useRouter();
  const followupId = router.params.id as string;
  
  const followups = useClinicStore(state => state.followups);
  const getPatientById = useClinicStore(state => state.getPatientById);
  const updateFollowupStatus = useClinicStore(state => state.updateFollowupStatus);

  const followup = useMemo(() => 
    followups.find(f => f.id === followupId),
    [followups, followupId]
  );
  const patient = useMemo(() => 
    followup ? getPatientById(followup.patientId) : null,
    [followup, getPatientById]
  );

  const sortedAttempts = useMemo(() => 
    [...(followup?.followupAttempts || [])].sort((a, b) => 
      dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
    ),
    [followup]
  );

  const dateStr = followup?.scheduledDate || followup?.suggestedDate || '';

  if (!followup || !patient) {
    return (
      <ScrollView className={styles.pageWrapper}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 28, color: '#999' }}>未找到复诊信息</Text>
        </View>
      </ScrollView>
    );
  }

  const statusInfo = getStatusInfo(followup.status);
  const urgencyInfo = getUrgencyColor(followup.urgency);
  const d = dayjs(dateStr);

  const goToPatient = () => {
    Taro.navigateTo({ url: `/pages/patientDetail/index?id=${patient.id}` });
  };

  const handleCall = () => {
    console.log('[FollowupDetail] 拨打电话:', patient.phone);
    Taro.showToast({ title: `拨打 ${patient.phone}`, icon: 'none' });
  };

  const handleMarkCompleted = () => {
    Taro.showModal({
      title: '确认完成',
      content: `确认将${patient.name}的复诊标记为已完成？`,
      confirmText: '确认完成',
      confirmColor: '#059669',
      success: (res) => {
        if (res.confirm) {
          updateFollowupStatus(followup.id, 'completed');
          Taro.showToast({ title: '已标记完成', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      },
    });
  };

  const handleMarkNoShow = () => {
    Taro.showModal({
      title: '标记爽约',
      content: `确认${patient.name}今日爽约？系统将进入前台跟进流程`,
      confirmText: '标记爽约',
      confirmColor: '#DC2626',
      success: (res) => {
        if (res.confirm) {
          updateFollowupStatus(followup.id, 'no_show');
          Taro.navigateTo({ url: `/pages/noShowFollowup/index?id=${followup.id}` });
        }
      },
    });
  };

  const handleViewFollowup = () => {
    if (followup.status === 'no_show') {
      Taro.navigateTo({ url: `/pages/noShowFollowup/index?id=${followup.id}` });
    } else {
      Taro.showToast({ title: '跟进功能：前台预约中', icon: 'none' });
    }
  };

  const renderActions = () => {
    switch (followup.status) {
      case 'scheduled_confirmed':
        return (
          <>
            <View className={styles.actionBtn} onClick={handleCall}>
              <Text className={styles.actionBtnText}>📞 联系患者</Text>
            </View>
            <View className={styles.dangerBtn} onClick={handleMarkNoShow}>
              <Text className={styles.dangerBtnText}>标记爽约</Text>
            </View>
            <View className={styles.primaryBtn} onClick={handleMarkCompleted}>
              <Text className={styles.primaryBtnText}>✅ 标记已完成</Text>
            </View>
          </>
        );
      case 'scheduled_unconfirmed':
      case 'pending_schedule':
        return (
          <>
            <View className={styles.actionBtn} onClick={handleCall}>
              <Text className={styles.actionBtnText}>📞 联系患者</Text>
            </View>
            <View className={styles.primaryBtn} onClick={handleViewFollowup}>
              <Text className={styles.primaryBtnText}>
                {followup.status === 'pending_schedule' ? '催促前台安排' : '确认到诊情况'}
              </Text>
            </View>
          </>
        );
      case 'no_show':
        if (isNoShowResolved(followup)) {
          const resolutionLabel: Record<NoShowResolution, string> = {
            reschedule: '📅 已重新安排',
            mark_important: '📌 已重点标记',
            stop_followup: '✋ 已停止追访',
          };
          return (
            <>
              <View className={styles.actionBtn}>
                <Text className={styles.actionBtnText}>{followup.noShowResolution ? resolutionLabel[followup.noShowResolution] : '已处理'}</Text>
              </View>
              {followup.replacedByFollowupId && (
                <View className={styles.primaryBtn} onClick={() => {
                  Taro.navigateTo({ url: `/pages/followupDetail/index?id=${followup.replacedByFollowupId}` });
                }}>
                  <Text className={styles.primaryBtnText}>查看新复诊安排 ›</Text>
                </View>
              )}
            </>
          );
        }
        return (
          <>
            <View className={styles.actionBtn} onClick={handleCall}>
              <Text className={styles.actionBtnText}>📞 联系患者</Text>
            </View>
            <View className={styles.primaryBtn} onClick={handleViewFollowup}>
              <Text className={styles.primaryBtnText}>📋 跟进处理</Text>
            </View>
          </>
        );
      case 'completed':
        return (
          <>
            <View className={styles.actionBtn} onClick={goToPatient}>
              <Text className={styles.actionBtnText}>查看患者详情</Text>
            </View>
            <View className={styles.primaryBtn} onClick={() => {
              Taro.navigateTo({ url: `/pages/scheduleFollowup/index?patientId=${patient.id}` });
            }}>
              <Text className={styles.primaryBtnText}>📋 安排下次复诊</Text>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView className={styles.pageWrapper} scrollY>
      <View className={classnames(styles.statusHeader, getHeaderClass(followup.status))}>
        <View className={styles.decorShape} />
        
        <View className={styles.statusBadgeRow}>
          <View className={styles.statusBadge}>
            <Text className={styles.statusBadgeText} style={{ background: statusInfo.bg, color: statusInfo.text, padding: '4rpx 12rpx', borderRadius: '8rpx' }}>
              {statusInfo.label}
            </Text>
          </View>
          <View className={styles.urgencyBadge}>
            <Text className={styles.urgencyBadgeText} style={{ background: urgencyInfo.bg, color: urgencyInfo.text, padding: '4rpx 12rpx', borderRadius: '8rpx' }}>
              {urgencyInfo.label}
            </Text>
          </View>
        </View>
        
        <View className={styles.dateDisplay}>
          <Text className={styles.dateMain}>{d.format('M月D日')}</Text>
          <Text className={styles.dateSub}>{getWeekday(dateStr)} · {d.format('YYYY年')}</Text>
        </View>
        
        <View className={styles.timeRow}>
          <Text className={styles.timeIcon}>🕐</Text>
          <Text className={styles.timeText}>
            {followup.scheduledTime 
              ? `预约时间 ${followup.scheduledTime}` 
              : `建议就诊日（前后浮动2-3天）`
            }
          </Text>
        </View>
      </View>

      <View className={styles.contentArea}>
        <View className={styles.patientCard}>
          <View className={styles.patientHeader}>
            <View className={styles.avatar}>
              <Text className={styles.avatarText}>{patient.name.charAt(0)}</Text>
            </View>
            <View className={styles.patientInfo}>
              <View className={styles.patientNameRow}>
                <Text className={styles.patientName}>{patient.name}</Text>
                <Text className={styles.patientGenderAge}>
                  {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁
                </Text>
              </View>
              <Text className={styles.patientPhone}>{patient.phone}</Text>
            </View>
            <View className={styles.viewAllBtn} onClick={goToPatient}>
              <Text className={styles.viewAllBtnText}>查看详情 ›</Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>🦷</Text>
            <Text className={styles.sectionTitle}>复诊信息</Text>
          </View>
          
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>治疗项目</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueHighlight)}>
              {followup.treatmentTypeName}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>复诊目的</Text>
            <Text className={styles.infoValue}>{followup.purpose}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>建议间隔</Text>
            <Text className={styles.infoValue}>{followup.intervalDays}天</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>建议日期</Text>
            <Text className={styles.infoValue}>{followup.suggestedDate}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{followup.createTime}</Text>
          </View>
        </View>

        {followup.doctorNote && (
          <View className={styles.infoCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>📝</Text>
              <Text className={styles.sectionTitle}>医生备注</Text>
            </View>
            <View className={styles.remarkBox}>
              <Text className={styles.remarkTitle}>⚠️ 重要提示</Text>
              <Text className={styles.remarkContent}>{followup.doctorNote}</Text>
            </View>
          </View>
        )}

        {followup.frontDeskNote && (
          <View className={styles.infoCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>💼</Text>
              <Text className={styles.sectionTitle}>前台反馈</Text>
            </View>
            <View className={styles.frontDeskBox}>
              <Text className={styles.frontDeskTitle}>前台跟进备注</Text>
              <Text className={styles.frontDeskContent}>{followup.frontDeskNote}</Text>
            </View>
          </View>
        )}

        {(sortedAttempts.length > 0 || followup.nextAction) && (
          <View className={styles.infoCard}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>📞</Text>
              <Text className={styles.sectionTitle}>跟进记录</Text>
            </View>
            
            {sortedAttempts.length === 0 ? (
              <View className={styles.emptyAttempts}>
                <Text className={styles.emptyAttemptsText}>暂无跟进记录</Text>
              </View>
            ) : (
              <View className={styles.followupAttempts}>
                {sortedAttempts.map(attempt => {
                  const resultInfo = getResultInfo(attempt.result);
                  return (
                    <View key={attempt.id} className={styles.attemptItem}>
                      <View className={styles.attemptIcon}>{getMethodIcon(attempt.method)}</View>
                      <View className={styles.attemptContent}>
                        <View className={styles.attemptRow1}>
                          <Text className={styles.attemptMethod}>
                            <Text className={classnames(styles.attemptResult, resultInfo.cls)}>
                              {resultInfo.label}
                            </Text>
                            {getMethodLabel(attempt.method)}联系
                          </Text>
                          <Text className={styles.attemptTime}>{formatDateTime(attempt.time)}</Text>
                        </View>
                        <View className={styles.attemptRow2}>操作人：{attempt.operator}</View>
                        {attempt.note && (
                          <Text className={styles.attemptNote}>"{attempt.note}"</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
            
            {followup.nextAction && (
              <View className={styles.nextActionBox}>
                <Text className={styles.nextActionTitle}>📍 下一步计划</Text>
                <Text className={styles.nextActionContent}>{followup.nextAction}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        {renderActions()}
      </View>
    </ScrollView>
  );
};

export default FollowupDetailPage;
