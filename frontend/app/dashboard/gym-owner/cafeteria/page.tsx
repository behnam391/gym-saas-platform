import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { CafeteriaProductsPanel } from '../../../../components/ui/cafeteria-products-panel';

interface Product {
  id: string;
  title: string;
  price: number;
  inventory: number;
  isActive: boolean;
  category: { name: string };
}

async function getProducts(): Promise<Product[]> {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    return await api.get<Product[]>('/cafeteria/products', { accessToken: token });
  } catch {
    return [];
  }
}

export default async function CafeteriaPage() {
  const products = await getProducts();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت بوفه</h1>
        <p className="text-muted">محصولات، موجودی و قیمت‌گذاری بوفه باشگاه</p>
      </header>
      <CafeteriaProductsPanel initial={products} />
    </div>
  );
}
