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

     const order=   this.orderRepository.create({paymentMethod:PaymentMethod.CASH,statusOrder:StatusOrder.ONHOLD,totalCost,pharmacy});
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
  async filterByDateState(date:string,state:StatusOrder) {

const [fromDate, toDate] = date.split(' ');
// Convert toDate to the end of the day
const endOfDay = new Date(toDate);
endOfDay.setHours(23, 59, 59, 999);

  
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
    .where('order.createdAt BETWEEN :fromDate AND :toDate', {
      fromDate: new Date(fromDate),
      toDate: endOfDay
    })
    .andWhere('order.statusOrder=:state',{state})
    .groupBy('order.id')
    .orderBy('order.id', 'DESC')
    .getRawMany();
    //tab space with CHR() is
  
  return result;
    }
  




  async findOne(id: number) {
  //  const order=await this.orderRepository.findOne({where:{id} 
  //   ,relations:['pharmacy','ordersDetail','ordersDetail.productInventory']});
  //   return order;
  // const result = await this.orderRepository.createQueryBuilder('order')
  // .leftJoin('order.pharmacy', 'pharmacy')
  // .leftJoin('order.ordersDetail', 'orderDetail')
  // .leftJoin('orderDetail.productInventory', 'productInventory')
  // .leftJoin('productInventory.store', 'store')
  // .leftJoin('productInventory.product', 'product')
  // .select('order.id', 'id')
  // .addSelect('STRING_AGG(DISTINCT store.storeName, REPEAT(\' \', 4))', 'From')
  // .addSelect('STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(\' \', 4))', 'To')
  // .addSelect('order.createdAt', 'Date')
  // .addSelect('order.statusOrder', 'State')
  // .addSelect('STRING_AGG(DISTINCT CONCAT(pharmacy.address, pharmacy.region, pharmacy.governorate, pharmacy.country), \', \')', 'Address')
  // .addSelect(
  //   'STRING_AGG(DISTINCT (product.name || \' \' || "product"."publicPrice" || \' \' ||"store"."storeName"|| \' \' ||"productInventory"."priceAfterOffer"::text || \' \' || "productInventory"."offerPercent"::text|| \' \' ||"orderDetail"."quantity"::text || \' \' || "orderDetail"."price"::text), REPEAT(\' \', 4)) ', "eeeee" )
  // .where('order.id = :id', { id: id })
  // .groupBy('order.id')
  // .getRawMany();
  // return result.map(event => ({
  //   ...event,
  //   Date: this.convertTo12HourFormat(event.Date).date,
  //   Time: this.convertTo12HourFormat(event.Date).time,
  // }));
  
  /**
   *    "eeeee": "BI-ALCOFAN 55.00 El amria 52.25 5 20 1045.00    PANADOL 44.00 El amriaaa 41.36 6 30 1240.80",
 "eeeee":  {Product:{BI-ALCOFAN,PANADOL},publicPrice{55.00,44.00},store{El amria,El amriaaa},priceAfterOffer{52.25,41.36},offerPercent{5,6},Quantity{20,30}}
           }
 "table": {{Product:BI-ALCOFAN,publicPrice:55.00,store:El amria,priceAfterOffer:52.25,offerPercent:5,Quantity:20},
          {Product:PANADOL,publicPrice:44.00,store:El amriaaa,priceAfterOffer:41.36,offerPercent:6,Quantity:30}}
   "Product$publicPrice": "BI-ALCOFAN 55.00    PANADOL 44.00",
        "Store": "El amria    El amriaaa",
        "priceAfterOffer$offerPercent": "41.36 6    52.25 5",
        "Quantity$Product Total": "20 1045.00    30 1240.80",
   */
        const result = await this.orderRepository.createQueryBuilder('order')
        .leftJoin('order.pharmacy', 'pharmacy')
        .leftJoin('order.ordersDetail', 'orderDetail')
        .leftJoin('orderDetail.productInventory', 'productInventory')
        .leftJoin('productInventory.store', 'store')
        .leftJoin('productInventory.product', 'product')
        .select('order.id', 'id')
        .addSelect('STRING_AGG(DISTINCT store.storeName, REPEAT(\' \', 4))', 'From')
        .addSelect('STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(\' \', 4))', 'To')
        .addSelect('order.createdAt', 'Date')
        .addSelect('order.statusOrder', 'State')
        .addSelect('STRING_AGG(DISTINCT CONCAT(pharmacy.address, pharmacy.region, pharmacy.governorate, pharmacy.country), \', \')', 'Address')
        .addSelect(
          `STRING_AGG(
            DISTINCT (
              product.name || '|' || 
              "product"."publicPrice" || '|' || 
              "store"."storeName" || '|' || 
              "productInventory"."priceAfterOffer"::text || '|' || 
              "productInventory"."offerPercent"::text || '|' || 
              "orderDetail"."quantity"::text || '|' || 
              "orderDetail"."price"::text
            ), 
            REPEAT(' ', 4)
          )`, 
          "table"
        )
        .where('order.id = :id', { id: id })
        .groupBy('order.id')
        .getRawMany();
      
      // Helper function to convert date to 12-hour format
      
      // Transform the raw results into the desired JSON structure
      let TotalBeforeDescound=0,TotalAfterDescound=0;
      const finalResults = result.map(rawOrder => {
        // Extract and transform the 'table' field into the desired structure
        const eeeeeParts = rawOrder.table.split('    '); // Split by the delimiter used in STRING_AGG
        const table = eeeeeParts.map(part => {
          // Remove extra spaces from storeName

          const [productName, publicPrice, storeName, priceAfterOffer, offerPercent, quantity,price] = part.split('|');
          TotalBeforeDescound+=parseFloat(publicPrice);
          TotalAfterDescound+=parseFloat(priceAfterOffer); 
          return {
            Product: productName,
            store: storeName,
            publicPrice: publicPrice,
            offer: offerPercent,
            Quantity: quantity,
            priceAfterOffer: priceAfterOffer,
            ProductTotal: price
          };
        
        });
       

        // Convert date to 12-hour format
        const { date, time } = this.convertTo12HourFormat(rawOrder.Date);
      
        // Construct the final JSON object
        return {
          id: rawOrder.id,
          State: rawOrder.State,
          Date: date,
          Time: time,
          From: rawOrder.From, 
          To: rawOrder.To, // Remove extra spaces
          Address: rawOrder.Address,
          table: table,
          TotalBeforeDescound,
          TotalAfterDescound,
          TotalDescound: TotalBeforeDescound-TotalAfterDescound+"("+(100-(TotalAfterDescound/TotalBeforeDescound*100)) +"%)"
        };
      });
      
    return finalResults;
  }
  private convertTo12HourFormat(date: Date): { date: string, time: string } {
    if (!date) {
      console.error('Date is undefined');  // Debugging log
      return { date: '', time: '' };
    }
  
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
  
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const formattedTime = `${hours12}:${minutesStr} ${period}`;
    //date.toISOString()
    return { date: formattedDate, time: formattedTime };
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
  return result.map(event => ({
    ...event,
    Date: this.convertTo12HourFormat(event.Date).date+'   '
    +this.convertTo12HourFormat(event.Date).time,
    
  })); 
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

  return result.map(event => ({
    ...event,
    Date: this.convertTo12HourFormat(event.Date).date+'   '
    +this.convertTo12HourFormat(event.Date).time,
    
  })); 
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
