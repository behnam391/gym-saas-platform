import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Brand } from '@/constants/theme';
import { ROLE_META, type ProRole } from '@/lib/types';
import { useSession } from '@/providers/session-provider';
import { quickActions } from './index';

export default function OperationsScreen() {
  const { session } = useSession();
  if (!session) return <Redirect href="/sign-in" />;
  const role = session.role as ProRole;
  const actions = quickActions(role);

  return (
    <Screen>
      <SectionHeader
        title="مرکز عملیات"
        subtitle={`ابزارهای مجاز برای نقش ${ROLE_META[role].label}`}
      />
      <Card style={styles.security}>
        <Ionicons name="shield-checkmark" size={25} color={Brand.emerald} />
        <View style={styles.securityBody}>
          <Text style={styles.securityTitle}>دسترسی نقش‌محور فعال است</Text>
          <Text style={styles.securityText}>
            فقط اطلاعات و عملیات مجاز مربوط به همین باشگاه نمایش داده می‌شود.
          </Text>
        </View>
      </Card>
      <View style={styles.list}>
        {actions.map((action) => (
          <Pressable
            key={`${action.route}-${action.title}`}
            onPress={() => router.push(action.route as never)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={18} color={Brand.muted} />
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{description(action.title)}</Text>
            </View>
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={23} color={Brand.emerald} />
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function description(title: string) {
  const values: Record<string, string> = {
    اعضا: 'مشاهده وضعیت عضویت و مدارک اعضای باشگاه',
    'ورود و خروج': 'اسکن Pass و ثبت دستی حضور',
    'ثبت ورود': 'اسکن Pass و مدیریت حاضران',
    پرسنل: 'ساخت حساب و کنترل دسترسی همکاران',
    بوفه: 'سفارش‌ها، محصولات و موجودی',
    سفارش‌ها: 'پیگیری سفارش از دریافت تا تحویل',
    محصولات: 'مدیریت کالا و موجودی بوفه',
    شاگردان: 'مشاهده شاگردان و برنامه‌های تمرینی',
    مراجعان: 'مشاهده مراجعان و وضعیت بدنی',
    'برنامه تمرین': 'ساخت و فعال‌سازی برنامه تمرینی',
    'برنامه غذایی': 'ساخت و فعال‌سازی برنامه تغذیه',
    'پیام‌ها': 'گفت‌وگوی امن با اعضای باشگاه',
    'اعلان‌ها': 'رویدادها و هشدارهای سامانه',
    پشتیبانی: 'ثبت و پیگیری درخواست پشتیبانی',
  };
  return values[title] ?? 'ورود به بخش عملیاتی';
}

const styles = StyleSheet.create({
  security: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  securityBody: { flex: 1, alignItems: 'flex-end', gap: 3 },
  securityTitle: { color: Brand.emerald, fontWeight: '900', fontSize: 13 },
  securityText: { color: Brand.muted, fontSize: 10, lineHeight: 17, textAlign: 'right' },
  list: { gap: 10 },
  action: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    backgroundColor: Brand.card,
    padding: 14,
  },
  pressed: { opacity: 0.7 },
  actionBody: { flex: 1, alignItems: 'flex-end', gap: 4 },
  actionTitle: { color: Brand.text, fontWeight: '900', fontSize: 14 },
  actionDescription: { color: Brand.muted, fontSize: 10, textAlign: 'right' },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Brand.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
