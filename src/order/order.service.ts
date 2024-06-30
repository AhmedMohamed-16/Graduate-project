 import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import {   Between, DataSource, Repository, SelectQueryBuilder } from 'typeorm'; 
import { InjectRepository } from '@nestjs/typeorm'; 
import { ProductInventoryService } from 'src/product-inventory/product-inventory.service';
import { OrderDetail } from './entities/order-details.entity';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import{Pharmacy} from 'src/pharmacy/entities/pharmacy.entity';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.entity'; 
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express'; 
import { ProductInventory } from 'src/product-inventory/entities/product-inventory.entity';
import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';
import { CalculationsHelper } from 'src/common/helpers/calculations.helper';
import { IsBooleanPipes } from 'src/common/pipes/user-type-validation.pipe';
@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orderRepository:Repository<Order>,
  @InjectRepository(OrderDetail) private readonly orderDetailRepository:Repository<OrderDetail>,
  private readonly productInventoryService:ProductInventoryService,
 
  private readonly pharmacyService:PharmacyService, ){}

  async create(id:number,res:Response,createOrderDto: CreateOrderDto) { 
    if(createOrderDto.ProductInventoryId.length != createOrderDto.quantity.length) {
      throw new BadRequestException('The length of products and qty do not match') ;
  }
 

        let totalCost=0;
        let ordersDetails:OrderDetail[]=[];
        let productInventory:ProductInventory[]=[];
          // const queryRunner = this.dataSource.createQueryRunner();
          // await queryRunner.connect();
          // await queryRunner.startTransaction();
          // try { 
         for (let i = 0; i < createOrderDto.ProductInventoryId.length; i++) {
            productInventory[i]= await this.productInventoryService.findOne(createOrderDto.ProductInventoryId[i]);
  
         if(productInventory[i].amount<createOrderDto.quantity[i]) {
          throw new NotFoundException(`the demand quantity is greater than from  the amount for this productInventory that is ${productInventory[i].amount}`) ;
         }

        
        //  await queryRunner.manager.save(productInventory); 

        const price=productInventory[i].priceAfterOffer*createOrderDto.quantity[i];
        const orderDetail =  this.orderDetailRepository.create({productInventory:productInventory[i],quantity:createOrderDto.quantity[i],price});
        // await this.orderDetailRepository.save(orderDetail ); 
     
      //  await queryRunner.manager.save(orderDetail);
        ordersDetails.push(orderDetail);
        totalCost+=price;
        }

        const pharmacy=await this.pharmacyService.findOne(id);

     const order=   this.orderRepository.create({paymentMethod:PaymentMethod.CASH,statusOrder:StatusOrder.CONFIRM,totalCost,pharmacy});
    //  await queryRunner.manager.save(order);
       for (let i = 0; i < ordersDetails.length; i++) {
         ordersDetails[i].order=order;  
        //  await queryRunner.manager.save(ordersDetails[i]);
        await this.orderDetailRepository.save(ordersDetails[i]);
        productInventory[i].amount-=createOrderDto.quantity[i];
        this.productInventoryService.save( productInventory[i]  );
       }
       return await this.orderRepository.save(order);

      // } 
    //  catch (err) {
      //   // since we have errors lets rollback the changes we made
      //   // await queryRunner.rollbackTransaction();
      //   const { httpAdapter } = this.httpAdapterHost
      //     httpAdapter.setHeader(res, 'X-Header', 'Foo')
      //     httpAdapter.status(res, err.status)
      //   return {message:err.message,status:err.status}
      // } finally {
      //   // you need to release a queryRunner which was manually instantiated
      //   // await queryRunner.release();
      // }  
  }

 async findAll() {
  const result = await this.orderRepository.createQueryBuilder('order')
  .leftJoin('order.pharmacy', 'pharmacy')
  .leftJoin('order.ordersDetail', 'orderDetail')
  .leftJoin('orderDetail.productInventory', 'productInventory')
  .leftJoin('productInventory.store', 'store')
  .select('order.id', 'id')
  .addSelect('STRING_AGG(DISTINCT store.storeName, REPEAT(\' \', 4))', 'From')
  .addSelect('STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(\' \', 4))', 'To')
  .addSelect('order.createdAt', 'Date')
  .addSelect('order.statusOrder', 'State')
  .groupBy('order.id')
  .orderBy('order.id', 'DESC')
  .getRawMany();
  //tab space with CHR() is

return result;
  }

  async findOne(id: number) {
   const order=await this.orderRepository.findOne({where:{id} 
    ,relations:['pharmacy','ordersDetail','ordersDetail.productInventory']});
  }

  
  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  } 

  async getTotalOrdersCount(id:number,
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    
    if (period === AllowedPeriods.ALLTIME) {
      
      const whereCondetion = id !==0 ? {pharmacy: {id:id}}:{};
      const totalCount = await this.orderRepository.count({where:  whereCondetion });
      // const totalCount = await this.orderRepository.count({where: {pharmacy: {
      //   id: 1
      // }} });
      return { count: totalCount, percentageChange: 0 };
    }

    // Calculate the start and end dates for the current and previous periods
    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = CalculationsHelper.calculateDateRanges(period);
    try { //id==0 means all pharmacies 
      
      const whereCurrent = id === 0 ? { createdAt: Between(currentStartDate, currentEndDate) } : { pharmacy: {id:id}, createdAt: Between(currentStartDate, currentEndDate) };
      const wherePrevious = id === 0 ? { createdAt: Between(previousStartDate, previousEndDate) } : { pharmacy: {id:id}, createdAt: Between(previousStartDate, previousEndDate) };
    
        const [currentCount, previousCount] = await Promise.all([
        this.orderRepository.count({
          where:  whereCurrent ,
        }),
        this.orderRepository.count({
          where: wherePrevious,
        }),
      ]);
     
    
      // Calculate the percentage change between the current and previous counts
      const percentageChange: number =
        CalculationsHelper.calculatePercentageChange(
          currentCount,
          previousCount,
        );
      return { count: currentCount, percentageChange };
    } catch (error) {
      console.error('An error occurred while counting the orders:', error);
    }
  }
  
 async getTopOrders() {
  const result = await this.orderRepository.createQueryBuilder('order')
  .leftJoin('order.ordersDetail','ordersDetail')
  .select('order.id')
  .addSelect('SUM(ordersDetail.quantity)', 'itemsQuantity')
  .addSelect('order.totalCost', 'totalPrice')
  .groupBy('order.id')
  .orderBy('COALESCE(order.totalCost,0)', 'DESC')
  .addOrderBy('COALESCE(SUM(ordersDetail.quantity),0)', 'DESC') // Add this line to order by itemsQuantity as well
  .limit(5)
  .getRawMany();
return result;
 }

 async getLates(){
  const result = await this.orderRepository.createQueryBuilder('order')
  .leftJoin('order.pharmacy', 'pharmacy')
  .leftJoin('order.ordersDetail', 'orderDetail')
  .leftJoin('orderDetail.productInventory', 'productInventory')
  .leftJoin('productInventory.store', 'store')
  .select('order.id', 'id')
  .addSelect('STRING_AGG(DISTINCT store.storeName, REPEAT(\' \', 4))', 'From')
  .addSelect('STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(\' \', 4))', 'To')
  .addSelect('order.createdAt', 'Date')
  .addSelect('order.statusOrder', 'State')
  .groupBy('order.id')
  .orderBy('order.id', 'DESC')
  .limit(5)
  .getRawMany();
  //tab space with CHR() is

return result;
 }

 async findOrdersforOnePharmacy(id:number){
  const result = await this.orderRepository.createQueryBuilder('order')
  .leftJoin('order.pharmacy', 'pharmacy')
  .leftJoin('order.ordersDetail', 'orderDetail')
  .leftJoin('orderDetail.productInventory', 'productInventory')
  .leftJoin('productInventory.store', 'store')
  .select('order.id', 'id')
  .addSelect('STRING_AGG(DISTINCT store.storeName, REPEAT(\' \', 4))', 'From')
  .addSelect('STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(\' \', 4))', 'To')
  .addSelect('order.createdAt', 'Date')
  .addSelect('order.statusOrder', 'State')
  .where('pharmacy.id=:id',{id:id})
  .groupBy('order.id')
  .orderBy('order.id', 'DESC') 
  .getRawMany();

   return result;
 }
 async getTotalBayingForOnePharmacy(id:number,
  period: AllowedPeriods,
): Promise<{ cost: number; percentageChange: number }> {
  
  if (period === AllowedPeriods.ALLTIME) {
    
    const whereCondetion = id !==0 ? {pharmacy: {id:id}}:{};
    const totalCost = await this.orderRepository.sum('totalCost',  whereCondetion );
    // const totalCount = await this.orderRepository.count({where: {pharmacy: {
    //   id: 1
    // }} });
    return { cost: totalCost, percentageChange: 0 };
  }

  // Calculate the start and end dates for the current and previous periods
  const {
    currentStartDate,
    currentEndDate,
    previousStartDate,
    previousEndDate,
  } = CalculationsHelper.calculateDateRanges(period);
  try { //id==0 means all pharmacies 
    
    const whereCurrent = id === 0 ? { createdAt: Between(currentStartDate, currentEndDate) } : { pharmacy: {id:id}, createdAt: Between(currentStartDate, currentEndDate) };
    const wherePrevious = id === 0 ? { createdAt: Between(previousStartDate, previousEndDate) } : { pharmacy: {id:id}, createdAt: Between(previousStartDate, previousEndDate) };
    
      let [currentCost , previousCost ] = await Promise.all([
      this.orderRepository.sum('totalCost',
          whereCurrent  
       ),
      this.orderRepository.sum('totalCost',
       wherePrevious,
      ),
    ]);
   
  //if currentCost or previousCost == null  assign 0
  if (currentCost == null) {
    currentCost = 0;
  }
  if (previousCost == null) {
    previousCost = 0;
  }


    // Calculate the percentage change between the current and previous counts
    const percentageChange: number =
      CalculationsHelper.calculatePercentageChange(
        currentCost,
        previousCost,
      );
    return { cost: currentCost, percentageChange };
  } catch (error) {
    console.error('An error occurred while counting the orders:', error);
  }
}

}
