import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CafeteriaService } from './cafeteria.service';
import { CreateProductDto, UpdateProductDto, PlaceOrderDto } from './dto/cafeteria.dto';

@Controller('cafeteria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CafeteriaController {
  constructor(private readonly cafeteriaService: CafeteriaService) {}

  @Get('categories')
  listCategories() {
    return this.cafeteriaService.listCategories();
  }

  @Post('categories')
  @Roles('GYM_OWNER', 'BUFFET_STAFF')
  createCategory(@Body('name') name: string) {
    return this.cafeteriaService.createCategory(name);
  }

  @Get('products')
  listProducts() {
    return this.cafeteriaService.listProducts();
  }

  @Post('products')
  @Roles('GYM_OWNER', 'BUFFET_STAFF')
  createProduct(@Body() dto: CreateProductDto) {
    return this.cafeteriaService.createProduct(dto);
  }

  @Patch('products/:productId')
  @Roles('GYM_OWNER', 'BUFFET_STAFF')
  updateProduct(@Param('productId') productId: string, @Body() dto: UpdateProductDto) {
    return this.cafeteriaService.updateProduct(productId, dto);
  }

  @Delete('products/:productId')
  @Roles('GYM_OWNER', 'BUFFET_STAFF')
  deleteProduct(@Param('productId') productId: string) {
    return this.cafeteriaService.deleteProduct(productId);
  }

  @Post('orders')
  @Roles('ATHLETE')
  placeOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: PlaceOrderDto) {
    return this.cafeteriaService.placeOrder(user.userId, dto);
  }

  @Get('orders/mine')
  @Roles('ATHLETE')
  myOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.cafeteriaService.listMyOrders(user.userId);
  }
}
