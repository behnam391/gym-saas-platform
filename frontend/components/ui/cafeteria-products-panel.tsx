'use client';

import { useState } from 'react';
import { MembershipCard } from './membership-card';
import { Badge } from './badge';
import { Input } from './input';
import { Button } from './button';
import { api, ApiError } from '../../lib/api';

interface Product {
  id: string;
  title: string;
  price: number;
  inventory: number;
  isActive: boolean;
  category: { name: string };
}

export function CafeteriaProductsPanel({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Requires an existing categoryId in a real flow — simplified here to
      // demonstrate the create-product call; category picker omitted.
      const created = await api.post<Product>(
        '/cafeteria/products',
        { title, price: Number(price), inventory: Number(inventory), categoryId: 'default' },
      );
      setProducts((p) => [created, ...p]);
      setTitle('');
      setPrice('');
      setInventory('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <MembershipCard className="lg:col-span-1">
        <h2 className="mb-4 font-bold">افزودن محصول جدید</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="قیمت (تومان)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <Input label="موجودی" type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} required />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'در حال افزودن…' : 'افزودن محصول'}</Button>
        </form>
      </MembershipCard>

      <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <MembershipCard key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-sm text-muted">{p.category?.name}</p>
              </div>
              <Badge tone={p.inventory > 0 ? 'success' : 'danger'}>
                موجودی: {p.inventory.toLocaleString('fa-IR')}
              </Badge>
            </div>
            <p className="mt-3 font-semibold text-accent-soft">{p.price.toLocaleString('fa-IR')} تومان</p>
          </MembershipCard>
        ))}
      </div>
    </div>
  );
}
