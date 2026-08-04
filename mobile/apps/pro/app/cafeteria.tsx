import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { EmptyState, LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage, dateTime, money } from '@/lib/format';
import type {
  CafeteriaCategory,
  CafeteriaOrder,
  CafeteriaProduct,
  CafeteriaSummary,
} from '@/lib/types';
import { useSession } from '@/providers/session-provider';

type Tab = 'orders' | 'products';
const STATUS: Record<string, { label: string; tone: 'warning' | 'info' | 'success' | 'muted' | 'danger' }> = {
  PLACED: { label: 'جدید', tone: 'warning' },
  PREPARING: { label: 'در حال آماده‌سازی', tone: 'info' },
  READY: { label: 'آماده تحویل', tone: 'success' },
  DELIVERED: { label: 'تحویل‌شده', tone: 'muted' },
  CANCELLED: { label: 'لغوشده', tone: 'danger' },
};

export default function CafeteriaScreen() {
  const { session } = useSession();
  const [tab, setTab] = useState<Tab>('orders');
  const [summary, setSummary] = useState<CafeteriaSummary | null>(null);
  const [orders, setOrders] = useState<CafeteriaOrder[]>([]);
  const [categories, setCategories] = useState<CafeteriaCategory[]>([]);
  const [products, setProducts] = useState<CafeteriaProduct[]>([]);
  const [showProduct, setShowProduct] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    price: '',
    inventory: '',
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const allowed = session && ['GYM_OWNER', 'BUFFET_STAFF'].includes(session.role);

  const load = useCallback(async () => {
    try {
      const [nextSummary, nextOrders, nextCategories, nextProducts] = await Promise.all([
        api.get<CafeteriaSummary>('/cafeteria/summary'),
        api.get<CafeteriaOrder[]>('/cafeteria/orders'),
        api.get<CafeteriaCategory[]>('/cafeteria/categories'),
        api.get<CafeteriaProduct[]>('/cafeteria/products'),
      ]);
      setSummary(nextSummary);
      setOrders(nextOrders);
      setCategories(nextCategories);
      setProducts(nextProducts);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || nextCategories[0]?.id || '',
      }));
    } catch (reason) {
      Alert.alert('خطا', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) return <Redirect href="/(tabs)" />;
  if (loading) return <LoadingState label="در حال دریافت اطلاعات بوفه…" />;

  async function updateOrder(order: CafeteriaOrder) {
    const next =
      order.status === 'PLACED'
        ? 'PREPARING'
        : order.status === 'PREPARING'
          ? 'READY'
          : order.status === 'READY'
            ? 'DELIVERED'
            : null;
    if (!next) return;
    setBusy(true);
    try {
      await api.patch(`/cafeteria/orders/${order.id}/status`, { status: next });
      await load();
    } catch (reason) {
      Alert.alert('وضعیت تغییر نکرد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function createCategory() {
    if (!categoryName.trim()) return;
    setBusy(true);
    try {
      const created = await api.post<CafeteriaCategory>('/cafeteria/categories', {
        name: categoryName.trim(),
      });
      setCategories((current) => [...current, created]);
      setForm((current) => ({ ...current, categoryId: created.id }));
      setCategoryName('');
    } catch (reason) {
      Alert.alert('دسته ساخته نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function createProduct() {
    if (!form.categoryId || !form.title.trim() || !form.price || !form.inventory) {
      Alert.alert('اطلاعات ناقص', 'دسته، عنوان، قیمت و موجودی را وارد کنید.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/cafeteria/products', {
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        inventory: Number(form.inventory),
      });
      setForm({
        categoryId: form.categoryId,
        title: '',
        description: '',
        price: '',
        inventory: '',
      });
      setShowProduct(false);
      await load();
    } catch (reason) {
      Alert.alert('محصول ساخته نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function adjustInventory(product: CafeteriaProduct, amount: number) {
    setBusy(true);
    try {
      await api.patch(`/cafeteria/products/${product.id}`, {
        inventory: Math.max(0, product.inventory + amount),
      });
      await load();
    } catch (reason) {
      Alert.alert('موجودی تغییر نکرد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen onRefresh={load}>
      <View style={styles.stats}>
        <MiniStat label="در صف" value={summary?.openOrders ?? 0} icon="receipt" tone="warning" />
        <MiniStat label="آماده" value={summary?.readyOrders ?? 0} icon="checkmark-circle" tone="success" />
        <MiniStat label="کمبود" value={summary?.lowStock ?? 0} icon="warning" tone="danger" />
      </View>
      <Card style={styles.revenue}>
        <Ionicons name="wallet" size={28} color={Brand.emerald} />
        <View style={styles.revenueBody}>
          <Text style={styles.revenueValue}>{money(summary?.deliveredRevenue)}</Text>
          <Text style={styles.revenueLabel}>فروش سفارش‌های تحویل‌شده</Text>
        </View>
      </Card>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('orders')} style={[styles.tab, tab === 'orders' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>سفارش‌ها</Text>
        </Pressable>
        <Pressable onPress={() => setTab('products')} style={[styles.tab, tab === 'products' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'products' && styles.tabTextActive]}>محصولات و موجودی</Text>
        </Pressable>
      </View>

      {tab === 'orders' ? (
        orders.length ? (
          orders.map((order) => {
            const state = STATUS[order.status] ?? STATUS.PLACED;
            const nextTitle =
              order.status === 'PLACED'
                ? 'شروع آماده‌سازی'
                : order.status === 'PREPARING'
                  ? 'آماده شد'
                  : order.status === 'READY'
                    ? 'تحویل سفارش'
                    : null;
            return (
              <Card key={order.id} style={styles.order}>
                <View style={styles.orderHead}>
                  <Badge tone={state.tone}>{state.label}</Badge>
                  <View style={styles.orderUser}>
                    <Text style={styles.orderName}>{order.user.firstName} {order.user.lastName}</Text>
                    <Text style={styles.orderMeta}>{order.user.mobile} · {dateTime(order.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.items}>
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.orderItem}>
                      <Text style={styles.quantity}>{item.quantity.toLocaleString('fa-IR')} عدد</Text>
                      <Text style={styles.productTitle}>{item.product.title}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.orderFoot}>
                  {nextTitle ? (
                    <Button compact title={nextTitle} loading={busy} onPress={() => updateOrder(order)} />
                  ) : <View />}
                  <Text style={styles.total}>{money(order.totalAmount)}</Text>
                </View>
              </Card>
            );
          })
        ) : (
          <Card><EmptyState title="سفارش فعالی وجود ندارد" /></Card>
        )
      ) : (
        <>
          <Button
            title={showProduct ? 'بستن فرم محصول' : 'افزودن محصول جدید'}
            icon={showProduct ? 'close' : 'add'}
            variant={showProduct ? 'secondary' : 'primary'}
            onPress={() => setShowProduct((value) => !value)}
          />
          {showProduct ? (
            <Card style={styles.form}>
              <Text style={styles.formTitle}>محصول جدید</Text>
              <View style={styles.categoryForm}>
                <Button compact title="ساخت دسته" onPress={createCategory} loading={busy} />
                <Field
                  style={styles.categoryInput}
                  value={categoryName}
                  onChangeText={setCategoryName}
                  placeholder="نام دسته جدید"
                />
              </View>
              <Text style={styles.label}>انتخاب دسته</Text>
              <View style={styles.categories}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setForm({ ...form, categoryId: category.id })}
                    style={[styles.category, form.categoryId === category.id && styles.categorySelected]}>
                    <Text style={[styles.categoryText, form.categoryId === category.id && styles.categoryTextSelected]}>
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Field label="عنوان محصول" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
              <Field label="توضیح کوتاه" value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
              <Field label="قیمت (تومان)" keyboardType="number-pad" value={form.price} onChangeText={(price) => setForm({ ...form, price })} />
              <Field label="موجودی اولیه" keyboardType="number-pad" value={form.inventory} onChangeText={(inventory) => setForm({ ...form, inventory })} />
              <Button title="ثبت محصول" onPress={createProduct} loading={busy} />
            </Card>
          ) : null}
          {products.length ? (
            products.map((product) => (
              <Card key={product.id} style={styles.product}>
                <View style={styles.productHead}>
                  <Badge tone={product.inventory <= 5 ? 'danger' : 'success'}>
                    {product.inventory.toLocaleString('fa-IR')} موجود
                  </Badge>
                  <View style={styles.productBody}>
                    <Text style={styles.productName}>{product.title}</Text>
                    <Text style={styles.productMeta}>{product.category.name} · {money(product.price)}</Text>
                  </View>
                  <View style={styles.productIcon}><Ionicons name="cube" size={20} color={Brand.emerald} /></View>
                </View>
                <View style={styles.inventory}>
                  <Button compact title="−۱" variant="secondary" disabled={busy} onPress={() => adjustInventory(product, -1)} />
                  <Text style={styles.inventoryValue}>موجودی {product.inventory.toLocaleString('fa-IR')}</Text>
                  <Button compact title="+۱" variant="secondary" disabled={busy} onPress={() => adjustInventory(product, 1)} />
                </View>
              </Card>
            ))
          ) : (
            <Card><EmptyState title="هنوز محصولی ثبت نشده است" /></Card>
          )}
        </>
      )}
    </Screen>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'warning' | 'success' | 'danger';
}) {
  const colors = {
    warning: [Brand.warningSoft, Brand.warning],
    success: [Brand.emeraldSoft, Brand.emerald],
    danger: [Brand.dangerSoft, Brand.danger],
  } as const;
  return (
    <Card style={styles.miniStat}>
      <View style={[styles.miniIcon, { backgroundColor: colors[tone][0] }]}>
        <Ionicons name={icon} size={20} color={colors[tone][1]} />
      </View>
      <Text style={styles.miniValue}>{value.toLocaleString('fa-IR')}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row-reverse', gap: 8 },
  miniStat: { flex: 1, padding: 11, alignItems: 'center', gap: 5 },
  miniIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  miniValue: { color: Brand.text, fontSize: 18, fontWeight: '900' },
  miniLabel: { color: Brand.muted, fontSize: 9 },
  revenue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  revenueBody: { flex: 1, alignItems: 'flex-end' },
  revenueValue: { color: Brand.text, fontWeight: '900', fontSize: 17 },
  revenueLabel: { color: Brand.muted, fontSize: 9, marginTop: 3 },
  tabs: { flexDirection: 'row-reverse', borderRadius: 15, backgroundColor: '#E8ECE8', padding: 4 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: Brand.card },
  tabText: { color: Brand.muted, fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: Brand.emerald },
  order: { gap: 11 },
  orderHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  orderUser: { flex: 1, alignItems: 'flex-end' },
  orderName: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  orderMeta: { color: Brand.muted, fontSize: 9, marginTop: 3 },
  items: { borderRadius: 13, backgroundColor: Brand.surface, padding: 11, gap: 8 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between' },
  quantity: { color: Brand.muted, fontSize: 10 },
  productTitle: { color: Brand.text, fontSize: 11, fontWeight: '800' },
  orderFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { color: Brand.emerald, fontWeight: '900', fontSize: 13 },
  form: { gap: 12 },
  formTitle: { color: Brand.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  categoryForm: { gap: 8 },
  categoryInput: { minHeight: 42 },
  label: { color: Brand.text, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  categories: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  category: { borderRadius: 11, backgroundColor: Brand.surface, paddingHorizontal: 11, paddingVertical: 8 },
  categorySelected: { backgroundColor: Brand.lime },
  categoryText: { color: Brand.muted, fontSize: 10, fontWeight: '800' },
  categoryTextSelected: { color: Brand.ink },
  product: { gap: 11 },
  productHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  productBody: { flex: 1, alignItems: 'flex-end' },
  productName: { color: Brand.text, fontSize: 13, fontWeight: '900' },
  productMeta: { color: Brand.muted, fontSize: 9, marginTop: 3 },
  productIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Brand.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  inventory: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inventoryValue: { color: Brand.text, fontSize: 11, fontWeight: '900' },
});
