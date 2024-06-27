 
import { Controller, Get, Post, Body, Patch, Param, Delete, Req, ParseIntPipe, UseGuards, Res, } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/auth/guards/role.guard'; 
import { Roles } from 'src/common/decorators/authorize.decorator';
import { UserType } from 'src/common/enums/user-type.enum';
import { JwtAuthGaurd } from 'src/auth/guards/jwt-auth.guard';
import { AllowedPeriodPipe } from 'src/common/pipes/user-type-validation.pipe';
import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';


@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService,
   ) {}

  @UseGuards(JwtAuthGaurd,RoleGuard)
  @Roles(UserType.PHARMACY)
  @Post()
  create(@Req() req,@Res({ passthrough: true }) res: Response,@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(req.user.payload.id,res,createOrderDto);
 
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
  @Get('/total-count/:period')
  async getTotalOrdersCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.orderService.getTotalOrdersCount(period);
 
  }

}
