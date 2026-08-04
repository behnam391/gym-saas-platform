import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage, dateTime } from '@/lib/format';
import type { AttendanceRecord, CrowdStatus, Member } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

export default function AttendanceScreen() {
  const { session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [crowd, setCrowd] = useState<CrowdStatus | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const allowed = session && ['GYM_OWNER', 'RECEPTION'].includes(session.role);

  const load = useCallback(async () => {
    try {
      const [nextMembers, nextRecords, nextCrowd] = await Promise.all([
        api.get<Member[]>('/tenants/me/members'),
        api.get<AttendanceRecord[]>('/attendance/recent'),
        api.get<CrowdStatus>('/attendance/crowd-status'),
      ]);
      setMembers(nextMembers);
      setRecords(nextRecords);
      setCrowd(nextCrowd);
    } catch (reason) {
      Alert.alert('خطا', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const candidates = useMemo(() => {
    const value = search.trim().toLowerCase();
    const active = members.filter((member) =>
      member.memberships?.some((membership) => membership.status === 'ACTIVE'),
    );
    return value
      ? active.filter((member) =>
          `${member.firstName} ${member.lastName} ${member.mobile}`.toLowerCase().includes(value),
        )
      : active.slice(0, 8);
  }, [members, search]);

  if (!allowed) return <Redirect href="/(tabs)" />;
  if (loading) return <LoadingState label="در حال آماده‌سازی پذیرش…" />;

  async function manualCheckIn() {
    if (!selected) {
      Alert.alert('انتخاب عضو', 'ابتدا عضو مورد نظر را انتخاب کنید.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/attendance/check-in', { userId: selected, method: 'MANUAL' });
      setSelected(null);
      setSearch('');
      await load();
      Alert.alert('ورود ثبت شد', 'عضو با موفقیت وارد باشگاه شد.');
    } catch (reason) {
      Alert.alert('ورود ثبت نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function redeem(value = token) {
    const normalized = value.trim();
    if (!normalized) return;
    setBusy(true);
    try {
      await api.post('/attendance/pass/redeem', { token: normalized });
      setToken('');
      setScanner(false);
      await load();
      Alert.alert('Pass معتبر است', 'ورود ورزشکار ثبت شد.');
    } catch (reason) {
      Alert.alert('Pass پذیرفته نشد', apiMessage(reason));
    } finally {
      setBusy(false);
      setTimeout(() => setScanned(false), 1200);
    }
  }

  async function openScanner() {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert('دسترسی دوربین', 'برای اسکن Pass باید اجازه دوربین را فعال کنید.');
        return;
      }
    }
    setScanned(false);
    setScanner(true);
  }

  async function checkOut(record: AttendanceRecord) {
    setBusy(true);
    try {
      await api.post(`/attendance/check-out/${record.id}`);
      await load();
    } catch (reason) {
      Alert.alert('خروج ثبت نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Screen onRefresh={load}>
        <Card style={styles.crowd}>
          <View style={styles.crowdIcon}>
            <Ionicons name="walk" size={28} color={Brand.ink} />
          </View>
          <View style={styles.crowdBody}>
            <Text style={styles.crowdValue}>{crowd?.activeCount ?? 0} نفر حاضر</Text>
            <Text style={styles.crowdText}>ظرفیت تعریف‌شده: {crowd?.capacity ?? 80} نفر</Text>
          </View>
          <Badge tone={crowd?.level === 'HIGH' ? 'danger' : 'success'}>
            {crowd?.level === 'HIGH' ? 'شلوغ' : 'عادی'}
          </Badge>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.title}>اسکن گُردیار Pass</Text>
          <Text style={styles.description}>
            دوربین را مقابل QR ورزشکار بگیرید یا کد Pass را وارد کنید.
          </Text>
          <Button title="باز کردن دوربین" icon="scan" onPress={openScanner} />
          <Field
            label="کد Pass"
            icon="key-outline"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            placeholder="کد دریافتی از اپ ورزشکار"
          />
          <Button
            title="بررسی و ثبت ورود"
            variant="secondary"
            loading={busy}
            disabled={!token.trim()}
            onPress={() => redeem()}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.title}>ثبت دستی ورود</Text>
          <Text style={styles.description}>برای مواقع اضطراری یا نبود دسترسی ورزشکار به اپ.</Text>
          <Field
            icon="search-outline"
            value={search}
            onChangeText={setSearch}
            placeholder="نام یا موبایل عضو"
          />
          <View style={styles.candidates}>
            {candidates.map((member) => (
              <Pressable
                key={member.id}
                onPress={() => setSelected(member.id)}
                style={[styles.candidate, selected === member.id && styles.candidateSelected]}>
                <Ionicons
                  name={selected === member.id ? 'radio-button-on' : 'radio-button-off'}
                  size={19}
                  color={selected === member.id ? Brand.emerald : Brand.muted}
                />
                <View style={styles.candidateBody}>
                  <Text style={styles.candidateName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <Text style={styles.candidateMobile}>{member.mobile}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Button
            title="ثبت ورود عضو انتخاب‌شده"
            icon="log-in-outline"
            loading={busy}
            disabled={!selected}
            onPress={manualCheckIn}
          />
        </Card>

        <Text style={styles.listTitle}>آخرین ورود و خروج‌ها</Text>
        {records.length ? (
          records.map((record) => (
            <Card key={record.id} style={styles.record}>
              <View style={styles.recordHead}>
                <Badge tone={record.checkOutAt ? 'muted' : 'success'}>
                  {record.checkOutAt ? 'خارج‌شده' : 'حاضر'}
                </Badge>
                <View style={styles.recordBody}>
                  <Text style={styles.recordName}>
                    {record.user.firstName} {record.user.lastName}
                  </Text>
                  <Text style={styles.recordMeta}>
                    {dateTime(record.checkInAt)} · {record.membership?.plan.title ?? record.method}
                  </Text>
                </View>
              </View>
              {!record.checkOutAt ? (
                <Button
                  title="ثبت خروج"
                  variant="secondary"
                  compact
                  disabled={busy}
                  onPress={() => checkOut(record)}
                />
              ) : null}
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState title="امروز ورود و خروجی ثبت نشده است" />
          </Card>
        )}
      </Screen>

      <Modal visible={scanner} animationType="slide" onRequestClose={() => setScanner(false)}>
        <View style={styles.scanner}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              scanned || busy
                ? undefined
                : ({ data }) => {
                    setScanned(true);
                    redeem(data);
                  }
            }
          />
          <View style={styles.scannerOverlay}>
            <Pressable onPress={() => setScanner(false)} style={styles.close}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>QR گُردیار Pass را داخل کادر قرار دهید</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  crowd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Brand.ink,
    borderColor: '#1A352B',
  },
  crowdIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.lime,
  },
  crowdBody: { flex: 1, alignItems: 'flex-end' },
  crowdValue: { color: '#fff', fontSize: 17, fontWeight: '900' },
  crowdText: { color: '#AEBDB5', fontSize: 9, marginTop: 3 },
  section: { gap: 12 },
  title: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  description: { color: Brand.muted, fontSize: 10, lineHeight: 17, textAlign: 'right' },
  candidates: { gap: 7 },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 10,
    gap: 9,
  },
  candidateSelected: { borderColor: Brand.emerald, backgroundColor: Brand.emeraldSoft },
  candidateBody: { flex: 1, alignItems: 'flex-end' },
  candidateName: { color: Brand.text, fontSize: 12, fontWeight: '900' },
  candidateMobile: { color: Brand.muted, fontSize: 9, marginTop: 2 },
  listTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  record: { gap: 11 },
  recordHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordBody: { flex: 1, alignItems: 'flex-end' },
  recordName: { color: Brand.text, fontWeight: '900', fontSize: 13 },
  recordMeta: { color: Brand.muted, fontSize: 9, marginTop: 3, textAlign: 'right' },
  scanner: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.25)',
  },
  close: {
    position: 'absolute',
    top: 55,
    left: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: { width: 260, height: 260, borderWidth: 3, borderColor: Brand.lime, borderRadius: 28 },
  scanHint: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    marginTop: 25,
    backgroundColor: 'rgba(0,0,0,.55)',
    borderRadius: 13,
    padding: 12,
  },
});
