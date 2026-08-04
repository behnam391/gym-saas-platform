import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage } from '@/lib/format';
import type { Member } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

export default function MembersScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const allowed = session && ['GYM_OWNER', 'RECEPTION'].includes(session.role);

  const load = useCallback(async () => {
    try {
      setItems(await api.get<Member[]>('/tenants/me/members'));
    } catch (reason) {
      Alert.alert('خطا', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      `${item.firstName} ${item.lastName} ${item.mobile}`.toLowerCase().includes(value),
    );
  }, [items, search]);

  if (!allowed) return <Redirect href="/(tabs)" />;
  if (loading) return <LoadingState label="در حال دریافت اعضای باشگاه…" />;

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function reviewInsurance(member: Member, status: 'APPROVED' | 'REJECTED') {
    const document = member.insuranceDocs?.find((item) => item.status === 'PENDING');
    if (!document) return;
    setBusyId(document.id);
    try {
      await api.patch(`/tenants/me/insurance/${document.id}`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'نیاز به بارگذاری مدرک معتبر و خوانا' : undefined,
      });
      await load();
    } catch (reason) {
      Alert.alert('ثبت نشد', apiMessage(reason));
    } finally {
      setBusyId(null);
    }
  }

  async function reviewConsent(member: Member, status: 'APPROVED' | 'REJECTED') {
    setBusyId(`consent-${member.id}`);
    try {
      await api.patch(`/tenants/me/parental-consent/${member.id}`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'مدرک رضایت‌نامه نیاز به اصلاح دارد' : undefined,
      });
      await load();
    } catch (reason) {
      Alert.alert('ثبت نشد', apiMessage(reason));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}>
          <Ionicons name="people" size={27} color={Brand.emerald} />
        </View>
        <View style={styles.summaryBody}>
          <Text style={styles.summaryValue}>{items.length.toLocaleString('fa-IR')}</Text>
          <Text style={styles.summaryLabel}>عضو ثبت‌شده در این باشگاه</Text>
        </View>
      </View>
      <Field
        icon="search-outline"
        value={search}
        onChangeText={setSearch}
        placeholder="جست‌وجو نام یا شماره موبایل"
      />

      {filtered.length ? (
        filtered.map((member) => {
          const membership = member.memberships?.[0];
          const pendingInsurance = member.insuranceDocs?.some((item) => item.status === 'PENDING');
          const pendingConsent = member.parentalConsent?.status === 'PENDING';
          const active = membership?.status === 'ACTIVE' && !member.isRestricted;
          return (
            <Card key={member.id} style={styles.member}>
              <View style={styles.memberHead}>
                <Badge tone={active ? 'success' : member.isRestricted ? 'danger' : 'warning'}>
                  {active ? 'فعال' : member.isRestricted ? 'محدود' : membership?.status ?? 'بدون عضویت'}
                </Badge>
                <View style={styles.memberBody}>
                  <Text style={styles.memberName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text style={styles.memberMobile}>{member.mobile}</Text>
                </View>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.firstName.slice(0, 1)}</Text>
                </View>
              </View>
              <View style={styles.plan}>
                <Ionicons name="card-outline" size={17} color={Brand.emerald} />
                <Text style={styles.planText}>{membership?.plan.title ?? 'پلن عضویت ثبت نشده'}</Text>
              </View>

              {pendingInsurance ? (
                <View style={styles.review}>
                  <Text style={styles.reviewTitle}>بیمه ورزشی در انتظار بررسی</Text>
                  <View style={styles.reviewActions}>
                    <Button
                      compact
                      title="رد مدرک"
                      variant="danger"
                      disabled={busyId !== null}
                      onPress={() =>
                        Alert.alert('رد بیمه', 'این مدرک رد شود؟', [
                          { text: 'انصراف', style: 'cancel' },
                          { text: 'رد شود', style: 'destructive', onPress: () => reviewInsurance(member, 'REJECTED') },
                        ])
                      }
                    />
                    <Button
                      compact
                      title="تأیید بیمه"
                      disabled={busyId !== null}
                      onPress={() => reviewInsurance(member, 'APPROVED')}
                    />
                  </View>
                </View>
              ) : null}

              {pendingConsent ? (
                <View style={styles.review}>
                  <Text style={styles.reviewTitle}>رضایت‌نامه والدین در انتظار بررسی</Text>
                  <View style={styles.reviewActions}>
                    <Button
                      compact
                      title="رد"
                      variant="danger"
                      disabled={busyId !== null}
                      onPress={() => reviewConsent(member, 'REJECTED')}
                    />
                    <Button
                      compact
                      title="تأیید"
                      disabled={busyId !== null}
                      onPress={() => reviewConsent(member, 'APPROVED')}
                    />
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })
      ) : (
        <Card>
          <EmptyState
            title={search ? 'عضوی پیدا نشد' : 'هنوز عضوی ثبت نشده است'}
            description={search ? 'عبارت جست‌وجو را تغییر دهید.' : 'اعضا پس از انتخاب باشگاه اینجا دیده می‌شوند.'}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: Brand.ink,
    padding: 17,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: Brand.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBody: { flex: 1, alignItems: 'flex-end' },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  summaryLabel: { color: '#AEBDB5', fontSize: 10 },
  member: { gap: 12 },
  memberHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberBody: { flex: 1, alignItems: 'flex-end', gap: 3 },
  memberName: { color: Brand.text, fontSize: 14, fontWeight: '900' },
  memberMobile: { color: Brand.muted, fontSize: 11 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Brand.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Brand.emerald, fontSize: 17, fontWeight: '900' },
  plan: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: Brand.surface,
    padding: 10,
  },
  planText: { color: Brand.muted, fontSize: 11, flex: 1, textAlign: 'right' },
  review: { borderTopWidth: 1, borderTopColor: Brand.line, paddingTop: 11, gap: 9 },
  reviewTitle: { color: Brand.warning, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  reviewActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
