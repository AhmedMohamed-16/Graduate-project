import { Controller, Get, Post, Body, Patch, Param, Delete, Req, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Req() req: Request,@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(1,createOrderDto);
  }

  @Get()
  findAllOrders() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOneOrder(@Param('id',ParseIntPipe) id: number) {
    return this.orderService.findOne(id); 
  }
  @Get(':id')
  findOrdersforUser(@Req() req: Request) {
    return this.orderService.findOneUser(1);
  }
  

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
