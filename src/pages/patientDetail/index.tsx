import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useClinicStore, isNoShowResolved } from '@/store/clinicStore';
import FollowupCard from '@/components/FollowupCard';
import dayjs from 'dayjs';

const PatientDetailPage: React.FC = () => {
  const router = useRouter();
  const patientId = router.params.id as string;
  
  const getPatientById = useClinicStore(state => state.getPatientById);
  const getFollowupsByPatientId = useClinicStore(state => state.getFollowupsByPatientId);

  const patient = useMemo(() => {
    if (!patientId) return null;
    return getPatientById(patientId);
  }, [patientId, getPatientById]);

  const patientFollowups = useMemo(() => {
    if (!patientId) return [];
    return getFollowupsByPatientId(patientId);
  }, [patientId, getFollowupsByPatientId]);

  const activeFollowups = useMemo(() => 
    patientFollowups.filter(f => f.status !== 'completed' && f.status !== 'cancelled' && !(f.status === 'no_show' && isNoShowResolved(f))),
    [patientFollowups]
  );

  const sortedHistory = useMemo(() => 
    [...(patient?.visitHistory || [])].sort((a, b) => 
      dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    ),
    [patient]
  );

  if (!patient) {
    return (
      <ScrollView className={styles.pageWrapper}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ fontSize: 28, color: '#999' }}>未找到患者信息</Text>
        </View>
      </ScrollView>
    );
  }

  const getGenderStyle = (gender: 'male' | 'female') => {
    if (gender === 'male') {
      return { bg: 'rgba(37, 99, 235, 0.35)', text: '#fff' };
    }
    return { bg: 'rgba(219, 39, 119, 0.35)', text: '#fff' };
  };
  const genderStyle = getGenderStyle(patient.gender);

  const handleCall = () => {
    console.log('[PatientDetail] 拨打电话:', patient.phone);
    Taro.showToast({ title: `拨打 ${patient.phone}`, icon: 'none' });
  };

  const handleScheduleFollowup = () => {
    Taro.navigateTo({
      url: `/pages/scheduleFollowup/index?patientId=${patient.id}`,
    });
  };

  const handleViewFollowups = () => {
    if (activeFollowups.length === 0) {
      Taro.showToast({ title: '暂无进行中复诊', icon: 'none' });
      return;
    }
    Taro.switchTab({ url: '/pages/followups/index' });
  };

  return (
    <ScrollView className={styles.pageWrapper} scrollY>
      <View className={styles.patientHeader}>
        <View className={styles.topRow}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>{patient.name.charAt(0)}</Text>
          </View>
          <View className={styles.infoBlock}>
            <View className={styles.nameRow}>
              <Text className={styles.nameText}>{patient.name}</Text>
              <View className={styles.genderBadge} style={{ background: genderStyle.bg }}>
                <Text className={styles.genderBadgeText} style={{ color: genderStyle.text }}>
                  {patient.gender === 'male' ? '男' : '女'}
                </Text>
              </View>
              <Text className={styles.ageText}>{patient.age}岁</Text>
            </View>
            <View className={styles.phoneRow} onClick={handleCall}>
              <Text className={styles.phoneIcon}>📞</Text>
              <Text className={styles.phoneText}>{patient.phone}</Text>
            </View>
            <View className={styles.metaRow}>
              {patient.medicalRecordNo && (
                <View className={styles.metaTag}>
                  <Text className={styles.metaTagText}>病历号: {patient.medicalRecordNo}</Text>
                </View>
              )}
              {patient.tags?.map(tag => (
                <View key={tag} className={styles.metaTag}>
                  <Text className={styles.metaTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{patient.visitCount || 0}</Text>
            <Text className={styles.statLabel}>累计就诊</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum} style={{ color: '#059669' }}>{activeFollowups.length}</Text>
            <Text className={styles.statLabel}>进行中复诊</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum} style={{ color: '#D97706' }}>
              {patient.firstVisitDate ? dayjs().diff(dayjs(patient.firstVisitDate), 'month') : 0}
            </Text>
            <Text className={styles.statLabel}>建档(月)</Text>
          </View>
        </View>
      </View>

      <View className={styles.contentArea}>
        {activeFollowups.length > 0 && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitle}>
                <View className={styles.sectionTitleBar} />
                <Text className={styles.sectionTitleText}>复诊待办</Text>
              </View>
              <View className={styles.sectionExtra} onClick={handleViewFollowups}>
                查看全部 ›
              </View>
            </View>
            {activeFollowups.slice(0, 3).map(f => (
              <FollowupCard 
                key={f.id} 
                followup={f} 
                variant="compact" 
                showPatientInfo={false} 
              />
            ))}
          </View>
        )}

        {patient.specialRemarks && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitle}>
                <View className={styles.sectionTitleBar} />
                <Text className={styles.sectionTitleText}>特别提醒</Text>
              </View>
            </View>
            <View className={styles.remarkBox}>
              <Text className={styles.remarkLabel}>⚠️ 医生备注</Text>
              <Text className={styles.remarkText}>{patient.specialRemarks}</Text>
            </View>
          </View>
        )}

        {((patient.allergies && patient.allergies.length > 0) || (patient.chronicDiseases && patient.chronicDiseases.length > 0)) && (
          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitle}>
                <View className={styles.sectionTitleBar} />
                <Text className={styles.sectionTitleText}>健康信息</Text>
              </View>
            </View>
            <View className={styles.healthList}>
              {patient.allergies?.map(a => (
                <View key={a} className={styles.healthItem}>
                  <Text className={styles.healthIcon}>🚫</Text>
                  <Text className={styles.healthText}>过敏: {a}</Text>
                </View>
              ))}
              {patient.chronicDiseases?.map(d => (
                <View key={d} className={styles.healthItem}>
                  <Text className={styles.healthIcon}>💊</Text>
                  <Text className={styles.healthText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionTitleBar} />
              <Text className={styles.sectionTitleText}>就诊记录</Text>
            </View>
            <View className={styles.sectionExtra}>
              共{sortedHistory.length}条 ›
            </View>
          </View>
          {sortedHistory.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无就诊记录</Text>
            </View>
          ) : (
            <View className={styles.visitList}>
              {sortedHistory.map(v => (
                <View key={v.id} className={styles.visitItem}>
                  <View className={styles.visitTimeline}>
                    <View className={styles.visitDot} />
                    <View className={styles.visitContent}>
                      <View className={styles.visitDateRow}>
                        <Text className={styles.visitDate}>{v.date}</Text>
                        <Text className={styles.visitDoctor}>接诊: {v.doctor}</Text>
                      </View>
                      <Text className={styles.visitDiagnosis}>诊断: {v.diagnosis}</Text>
                      <Text className={styles.visitTreatment}>处理: {v.treatment}</Text>
                      {v.toothNumbers && v.toothNumbers.length > 0 && (
                        <View className={styles.visitTeeth}>
                          {v.toothNumbers.map(t => (
                            <View key={t} className={styles.teethTag}>
                              <Text className={styles.teethTagText}>{t}牙位</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.secondaryBtn} onClick={handleCall}>
          <Text className={styles.secondaryBtnText}>📞 联系</Text>
        </View>
        <View className={styles.primaryBtn} onClick={handleScheduleFollowup}>
          <Text className={styles.primaryBtnText}>📋 安排复诊</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PatientDetailPage;
