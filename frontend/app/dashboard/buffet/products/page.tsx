import { cookies } from 'next/headers';
import { api } from '../../../../lib/api';
import { CafeteriaProductsPanel } from '../../../../components/ui/cafeteria-products-panel';
export default async function BuffetProductsPage() { const token = (await cookies()).get('accessToken')?.value; const [products, categories] = await Promise.all([api.get<any[]>('/cafeteria/products', { accessToken: token }), api.get<any[]>('/cafeteria/categories', { accessToken: token })]); return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-extrabold">محصولات و موجودی</h1><p className="text-muted">قیمت، دسته‌بندی و تعداد موجود محصولات بوفه</p></header><CafeteriaProductsPanel initial={products} categories={categories} /></div>; }
