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

async function getData(): Promise<{ products: Product[]; categories: { id: string; name: string }[] }> {
  const token = (await cookies()).get('accessToken')?.value;
  try {
    const [products, categories] = await Promise.all([
      api.get<Product[]>('/cafeteria/products', { accessToken: token }),
      api.get<{ id: string; name: string }[]>('/cafeteria/categories', { accessToken: token }),
    ]);
    return { products, categories };
  } catch {
    return { products: [], categories: [] };
  }
}

export default async function CafeteriaPage() {
  const { products, categories } = await getData();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">مدیریت بوفه</h1>
        <p className="text-muted">محصولات، موجودی و قیمت‌گذاری بوفه باشگاه</p>
      </header>
      <CafeteriaProductsPanel initial={products} categories={categories} />
    </div>
  );
}
