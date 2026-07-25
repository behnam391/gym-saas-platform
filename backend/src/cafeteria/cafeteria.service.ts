import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context';
import { CreateProductDto, UpdateProductDto, PlaceOrderDto } from './dto/cafeteria.dto';

@Injectable()
export class CafeteriaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
  ) {}

  listCategories() {
    return this.prisma.forTenant((tx) =>
      tx.productCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    );
  }

  createCategory(name: string) {
    return this.prisma.forTenant((tx) =>
      tx.productCategory.create({
        data: { name, tenantId: this.tenantContext.requireTenantId() },
      }),
    );
  }

  listProducts() {
    return this.prisma.forTenant((tx) =>
      tx.cafeteriaProduct.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { title: 'asc' },
      }),
    );
  }

  createProduct(dto: CreateProductDto) {
    return this.prisma.forTenant((tx) =>
      tx.cafeteriaProduct.create({
        data: { ...dto, tenantId: this.tenantContext.requireTenantId() },
      }),
    );
  }

  updateProduct(productId: string, dto: UpdateProductDto) {
    return this.prisma.forTenant((tx) =>
      tx.cafeteriaProduct.update({ where: { id: productId }, data: dto }),
    );
  }

  deleteProduct(productId: string) {
    // Soft delete by deactivating — preserves order history integrity.
    return this.prisma.forTenant((tx) =>
      tx.cafeteriaProduct.update({ where: { id: productId }, data: { isActive: false } }),
    );
  }

  /**
   * Places an order with an atomic, race-safe stock check: the inventory
   * decrement uses a conditional `updateMany` (WHERE inventory >= quantity)
   * inside the same transaction as the order creation, so two concurrent
   * orders can never oversell the last unit of a product.
   */
  async placeOrder(userId: string, dto: PlaceOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('سفارش باید حداقل یک کالا داشته باشد.');
    }

    return this.prisma.forTenant(async (tx) => {
      let total = 0;
      const orderItemsData: { productId: string; quantity: number; unitPrice: any }[] = [];

      for (const item of dto.items) {
        const product = await tx.cafeteriaProduct.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new NotFoundException(`محصول با شناسه ${item.productId} یافت نشد.`);
        }

        const decrement = await tx.cafeteriaProduct.updateMany({
          where: { id: item.productId, inventory: { gte: item.quantity } },
          data: { inventory: { decrement: item.quantity } },
        });
        if (decrement.count === 0) {
          throw new BadRequestException(`موجودی «${product.title}» کافی نیست.`);
        }

        total += Number(product.price) * item.quantity;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      return tx.order.create({
        data: {
          tenantId: this.tenantContext.requireTenantId(),
          userId,
          status: 'PLACED',
          totalAmount: total,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
    });
  }

  listMyOrders(userId: string) {
    return this.prisma.forTenant((tx) =>
      tx.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }


  listOrders() {
    return this.prisma.forTenant((tx) => tx.order.findMany({
      where: { status: { not: 'CART' } },
      include: {
        user: { select: { firstName: true, lastName: true, mobile: true } },
        items: { include: { product: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }));
  }

  updateOrderStatus(orderId: string, status: 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED') {
    return this.prisma.forTenant((tx) => tx.order.update({ where: { id: orderId }, data: { status } }));
  }

  async summary() {
    return this.prisma.forTenant(async (tx) => {
      const [openOrders, readyOrders, lowStock, revenue, products] = await Promise.all([
        tx.order.count({ where: { status: { in: ['PLACED', 'PREPARING'] } } }),
        tx.order.count({ where: { status: 'READY' } }),
        tx.cafeteriaProduct.count({ where: { isActive: true, inventory: { lte: 5 } } }),
        tx.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { totalAmount: true } }),
        tx.cafeteriaProduct.count({ where: { isActive: true } }),
      ]);
      return { openOrders, readyOrders, lowStock, products, deliveredRevenue: Number(revenue._sum.totalAmount ?? 0) };
    });
  }
}
