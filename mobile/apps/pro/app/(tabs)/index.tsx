import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import {
  ROLE_META,
  type CafeteriaOrder,
  type CafeteriaSummary,
  type CrowdStatus,
  type Member,
  type NutritionClient,
  type PaymentSummary,
  type ProProfile,
  type ProRole,
  type Staff,
  type Ticket,
  type TrainerStudent,
} from '@/lib/types';
import { useSession } from '@/providers/session-provider';

type DashboardData = {
  profile: ProProfile | null;
  crowd: CrowdStatus | null;
  payment: PaymentSummary | null;
  members: Member[];
  staff: Staff[];
  tickets: Ticket[];
  cafeteria: CafeteriaSummary | null;
  orders: CafeteriaOrder[];
  students: TrainerStudent[];
  clients: NutritionClient[];
};

const EMPTY: DashboardData = {
  profile: null,
  crowd: null,
  payment: null,
  members: [],
  staff: [],
  tickets: [],
  cafeteria: null,
  orders: [],
  students: [],
  clients: [],
};

const STAT_COLORS = {
  success: { background: Brand.emeraldSoft, color: Brand.emerald },
  info: { background: Brand.infoSoft, color: Brand.info },
  warning: { background: Brand.warningSoft, color: Brand.warning },
  danger: { background: Brand.dangerSoft, color: Brand.danger },
} as const;

async function optional<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default function DashboardScreen() {
  const { session, isLoading } = useSession();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role = session?.role as ProRole | undefined;
  const load = useCallback(async () => {
    if (!role) return;
    const [profile, crowd] = await Promise.all([
      optional(api.get<ProProfile>('/profiles/me'), null),
      optional(api.get<CrowdStatus>('/attendance/crowd-status'), null),
    ]);
    const next = { ...EMPTY, profile, crowd };
    if (role === 'GYM_OWNER') {
      const [payment, members, staff, tickets, cafeteria] = await Promise.all([
        optional(api.get<PaymentSummary>('/payments/summary'), null),
        optional(api.get<Member[]>('/tenants/me/members'), []),
        optional(api.get<Staff[]>('/tenant-staff'), []),
        optional(api.get<Ticket[]>('/tickets'), []),
        optional(api.get<CafeteriaSummary>('/cafeteria/summary'), null),
      ]);
      Object.assign(next, { payment, members, staff, tickets, cafeteria });
    } else if (role === 'RECEPTION') {
      const [members, tickets] = await Promise.all([
        optional(api.get<Member[]>('/tenants/me/members'), []),
        optional(api.get<Ticket[]>('/tickets'), []),
      ]);
      Object.assign(next, { members, tickets });
    } else if (role === 'BUFFET_STAFF') {
      const [cafeteria, orders] = await Promise.all([
        optional(api.get<CafeteriaSummary>('/cafeteria/summary'), null),
        optional(api.get<CafeteriaOrder[]>('/cafeteria/orders'), []),
      ]);
      Object.assign(next, { cafeteria, orders });
    } else if (role === 'TRAINER') {
      next.students = await optional(api.get<TrainerStudent[]>('/trainers/students'), []);
    } else if (role === 'NUTRITIONIST') {
      next.clients = await optional(api.get<NutritionClient[]>('/nutritionists/clients'), []);
    }
    setData(next);
  }, [role]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (isLoading) return <LoadingState />;
  if (!session || !role) return <Redirect href="/sign-in" />;
  if (loading) return <LoadingState label="در حال آماده‌سازی داشبورد…" />;

  const name = data.profile
    ? `${data.profile.firstName} ${data.profile.lastName}`
    : ROLE_META[role].label;
  const openTickets = data.tickets.filter((item) =>
    ['OPEN', 'IN_PROGRESS'].includes(item.status),
  ).length;

  const stats =
    role === 'GYM_OWNER'
      ? [
          ['اعضای فعال', data.payment?.activeMemberships ?? data.members.length, 'people', 'success'],
          ['درآمد این ماه', money(data.payment?.revenueThisMonth), 'wallet', 'info'],
          ['پرسنل فعال', data.staff.filter((item) => item.isActive).length, 'id-card', 'warning'],
          ['درخواست باز', openTickets, 'alert-circle', 'danger'],
        ]
      : role === 'RECEPTION'
        ? [
            ['کل اعضا', data.members.length, 'people', 'success'],
            ['حاضر در باشگاه', data.crowd?.activeCount ?? 0, 'walk', 'info'],
            ['درخواست باز', openTickets, 'ticket', 'warning'],
          ]
        : role === 'BUFFET_STAFF'
          ? [
              ['سفارش در صف', data.cafeteria?.openOrders ?? 0, 'receipt', 'warning'],
              ['آماده تحویل', data.cafeteria?.readyOrders ?? 0, 'checkmark-circle', 'success'],
              ['کمبود موجودی', data.cafeteria?.lowStock ?? 0, 'warning', 'danger'],
              ['فروش تحویلی', money(data.cafeteria?.deliveredRevenue), 'wallet', 'info'],
            ]
          : role === 'TRAINER'
            ? [
                ['شاگرد فعال', data.students.length, 'people', 'success'],
                ['حاضر در باشگاه', data.crowd?.activeCount ?? 0, 'barbell', 'info'],
              ]
            : [
                ['مراجع فعال', data.clients.length, 'people', 'success'],
                ['حاضر در باشگاه', data.crowd?.activeCount ?? 0, 'nutrition', 'info'],
              ];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.push('/notifications')} style={styles.notification}>
          <Ionicons name="notifications-outline" size={22} color={Brand.text} />
        </Pressable>
        <View style={styles.identity}>
          <Text style={styles.hello}>سلام، {name}</Text>
          <Text style={styles.role}>{ROLE_META[role].label}</Text>
        </View>
      </View>

      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons
            name={ROLE_META[role].icon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={Brand.ink}
          />
        </View>
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>گُردیار پرو</Text>
          <Text style={styles.heroTitle}>{ROLE_META[role].description}</Text>
          {data.profile?.tenant ? (
            <Text style={styles.heroTenant}>{data.profile.tenant.name}</Text>
          ) : null}
        </View>
      </Card>

      <View style={styles.statGrid}>
        {stats.map(([label, value, icon, tone]) => {
          const colors = STAT_COLORS[tone as keyof typeof STAT_COLORS];
          return (
            <Card key={String(label)} style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: colors.background }]}>
                <Ionicons
                  name={icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={colors.color}
                />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {String(value)}
              </Text>
              <Text style={styles.statLabel}>{String(label)}</Text>
            </Card>
          );
        })}
      </View>

      <Card>
        <View style={styles.cardHeading}>
          <Badge tone={data.crowd?.level === 'HIGH' ? 'danger' : 'success'}>
            {data.crowd?.level === 'HIGH' ? 'شلوغ' : 'عادی'}
          </Badge>
          <View>
            <Text style={styles.cardTitle}>وضعیت زنده باشگاه</Text>
            <Text style={styles.cardSubtitle}>تعداد افراد حاضر در همین لحظه</Text>
          </View>
        </View>
        <View style={styles.crowdRow}>
          <Ionicons name="people-circle" size={55} color={Brand.emerald} />
          <View style={styles.crowdNumbers}>
            <Text style={styles.crowdValue}>{data.crowd?.activeCount ?? 0}</Text>
            <Text style={styles.crowdCapacity}>از ظرفیت {data.crowd?.capacity ?? 80} نفر</Text>
          </View>
        </View>
      </Card>

      <View style={styles.quickHeader}>
        <Pressable onPress={() => router.push('/(tabs)/operations')}>
          <Text style={styles.allActions}>همه عملیات</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>دسترسی سریع</Text>
      </View>
      <View style={styles.quickGrid}>
        {quickActions(role).slice(0, 4).map((action) => (
          <Pressable
            key={action.route}
            onPress={() => router.push(action.route as never)}
            style={styles.quickAction}>
            <View style={styles.quickIcon}>
              <Ionicons name={action.icon} size={22} color={Brand.emerald} />
            </View>
            <Text style={styles.quickTitle}>{action.title}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export function quickActions(role: ProRole) {
  const common = [
    { title: 'پیام‌ها', icon: 'chatbubbles-outline' as const, route: '/(tabs)/messages' },
    { title: 'اعلان‌ها', icon: 'notifications-outline' as const, route: '/notifications' },
    { title: 'پشتیبانی', icon: 'help-buoy-outline' as const, route: '/support' },
  ];
  if (role === 'GYM_OWNER') {
    return [
      { title: 'اعضا', icon: 'people-outline' as const, route: '/members' },
      { title: 'ورود و خروج', icon: 'scan-outline' as const, route: '/attendance' },
      { title: 'پرسنل', icon: 'id-card-outline' as const, route: '/staff' },
      { title: 'بوفه', icon: 'cafe-outline' as const, route: '/cafeteria' },
      ...common,
    ];
  }
  if (role === 'RECEPTION') {
    return [
      { title: 'ثبت ورود', icon: 'scan-outline' as const, route: '/attendance' },
      { title: 'اعضا', icon: 'people-outline' as const, route: '/members' },
      ...common,
    ];
  }
  if (role === 'BUFFET_STAFF') {
    return [
      { title: 'سفارش‌ها', icon: 'receipt-outline' as const, route: '/cafeteria' },
      { title: 'محصولات', icon: 'cube-outline' as const, route: '/cafeteria' },
      ...common,
    ];
  }
  return [
    {
      title: role === 'TRAINER' ? 'شاگردان' : 'مراجعان',
      icon: 'people-outline' as const,
      route: '/professional',
    },
    {
      title: role === 'TRAINER' ? 'برنامه تمرین' : 'برنامه غذایی',
      icon: role === 'TRAINER' ? ('barbell-outline' as const) : ('nutrition-outline' as const),
      route: '/professional',
    },
    ...common,
  ];
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { alignItems: 'flex-end', gap: 2 },
  hello: { color: Brand.text, fontWeight: '900', fontSize: 17 },
  role: { color: Brand.emerald, fontSize: 11, fontWeight: '800' },
  notification: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: Brand.ink,
    borderColor: '#1A352B',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: Brand.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { flex: 1, alignItems: 'flex-end', gap: 4 },
  heroEyebrow: { color: Brand.lime, fontWeight: '900', fontSize: 11 },
  heroTitle: { color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'right' },
  heroTenant: { color: '#AEBDB5', fontSize: 11 },
  statGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', flexGrow: 1, minHeight: 128, gap: 7 },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  statValue: { color: Brand.text, fontSize: 19, fontWeight: '900', textAlign: 'right' },
  statLabel: { color: Brand.muted, fontSize: 10, textAlign: 'right' },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: Brand.text, fontWeight: '900', textAlign: 'right' },
  cardSubtitle: { color: Brand.muted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  crowdRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 17 },
  crowdNumbers: { alignItems: 'flex-end' },
  crowdValue: { color: Brand.text, fontSize: 30, fontWeight: '900' },
  crowdCapacity: { color: Brand.muted, fontSize: 10 },
  quickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allActions: { color: Brand.emerald, fontSize: 11, fontWeight: '900' },
  sectionTitle: { color: Brand.text, fontSize: 16, fontWeight: '900' },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickAction: {
    width: '48%',
    flexGrow: 1,
    minHeight: 92,
    backgroundColor: Brand.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 14,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Brand.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { color: Brand.text, fontWeight: '900', fontSize: 12 },
});
