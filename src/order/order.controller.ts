 
import { Controller, Get, Post, Body, Patch, Param, Delete, Req, ParseIntPipe, UseGuards, Res, } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/auth/guards/role.guard'; 
import { Roles } from 'src/common/decorators/authorize.decorator';
import { UserType } from 'src/common/enums/user-type.enum';
import { JwtAuthGaurd } from 'src/auth/guards/jwt-auth.guard';
import { AllowedPeriodPipe, IsBooleanPipes } from 'src/common/pipes/user-type-validation.pipe';
import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';

import{Pharmacy} from 'src/pharmacy/entities/pharmacy.entity';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { join } from 'path'
import { ProductInventoryService } from 'src/product-inventory/product-inventory.service';
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService,
    private readonly  productInventoryService: ProductInventoryService
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
 
  @Get('/get-latest') //for orders
  async getLates( )  {
    return await this.orderService.getLates();
  }


  @Get('/top-orders') //for orders
  async getTopOrders( )  {
    return await this.orderService.getTopOrders();
  }
  @Get('/total-count/:period')
  async getTotalOrdersCount(
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.orderService.getTotalOrdersCount(0,period);
 
  }
  @Get('/total-count-ForOnePharmacy/:id/:period')
  async getTotalOrdersCountForOnePharmacy(@Param('id',ParseIntPipe) id: number,
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    return await this.orderService.getTotalOrdersCount(id,period);
  }
  @Get('/total-baying-ForOnePharmacy/:id/:period')
  async getTotalBayingForOnePharmacy(@Param('id',ParseIntPipe) id: number,
    @Param('period', AllowedPeriodPipe) period: AllowedPeriods,
  ): Promise<{ cost: number; percentageChange: number }> {
    return await this.orderService.getTotalBayingForOnePharmacy(id,period);
  }
  @Get('/mostSelling/:region')
  mostSelling(@Param('region') region:string
    , @Res() res) {
       
      const result=this.orderService.getMostSoldProductInventory(region);
      return {result,image:res.sendFile(join(process.cwd(), `uploads/${name}`))};
  }
   
  
  @Get('/HotDeals')
  async getHotDeals() {
     return await this.productInventoryService.getHotDeals();
  }

  @Get(':id')
  findOneOrder(@Param('id',ParseIntPipe) id: number) {
    return this.orderService.findOne(id); 
  }
  @Get('findOrdersforPharmacy/:id')
  findOrdersforPharmacy(@Param('id',ParseIntPipe) id: number) {
    return this.orderService.findOrdersforOnePharmacy(id);
  }
  

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
  @Get('/:date/:state')
  findAllOrders_filterByDateState(@Param('date') date:string,@Param('state') state:StatusOrder) {
    return this.orderService.filterByDateState(date,state);
  }

}
