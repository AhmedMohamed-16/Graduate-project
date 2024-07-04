import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Between, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductInventoryService } from 'src/product-inventory/product-inventory.service';
import { OrderDetail } from './entities/order-details.entity';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { Pharmacy } from 'src/pharmacy/entities/pharmacy.entity';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.entity';
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ProductInventory } from 'src/product-inventory/entities/product-inventory.entity';
import { AllowedPeriods } from 'src/common/enums/allowed-periods.enum';

import { CalculationsHelper } from 'src/common/helpers/calculations.helper';import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
  subMonths, 
} from 'date-fns';
import { IsBooleanPipes } from 'src/common/pipes/user-type-validation.pipe';
import { StoreService } from 'src/store/store.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    private readonly productInventoryService: ProductInventoryService,

    private readonly pharmacyService: PharmacyService,
    private readonly storeService: StoreService,
  ) {}

  async create(id: number, res: Response, createOrderDto: CreateOrderDto) {
    if (
      createOrderDto.ProductInventoryId.length != createOrderDto.quantity.length
    ) {
      throw new BadRequestException(
        'The length of products and qty do not match',
      );
    }

    let totalCost = 0;
    let ordersDetails: OrderDetail[] = [];
    let productInventory: ProductInventory[] = [];
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    // try {
    for (let i = 0; i < createOrderDto.ProductInventoryId.length; i++) {
      productInventory[i] = await this.productInventoryService.findOne(
        createOrderDto.ProductInventoryId[i],
      );

      if (productInventory[i].amount < createOrderDto.quantity[i]) {
        throw new NotFoundException(
          `the demand quantity is greater than from  the amount for this productInventory that is ${productInventory[i].amount}`,
        );
      }

      //  await queryRunner.manager.save(productInventory);

      const price =
        productInventory[i].priceAfterOffer * createOrderDto.quantity[i];
      const orderDetail = this.orderDetailRepository.create({
        productInventory: productInventory[i],
        quantity: createOrderDto.quantity[i],
        price,
      });
      // await this.orderDetailRepository.save(orderDetail );

      //  await queryRunner.manager.save(orderDetail);
      ordersDetails.push(orderDetail);
      totalCost += price;
    }

    const pharmacy = await this.pharmacyService.findOne(id);

    const order = this.orderRepository.create({
      paymentMethod: PaymentMethod.CASH,
      statusOrder: StatusOrder.ONHOLD,
      totalCost,
      pharmacy,
    });
    //  await queryRunner.manager.save(order);
    for (let i = 0; i < ordersDetails.length; i++) {
      ordersDetails[i].order = order;
      //  await queryRunner.manager.save(ordersDetails[i]);
      await this.orderDetailRepository.save(ordersDetails[i]);
      productInventory[i].amount -= createOrderDto.quantity[i];
      this.productInventoryService.save(productInventory[i]);
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
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.pharmacy', 'pharmacy')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .leftJoin('productInventory.store', 'store')
      .select('order.id', 'id')
      .addSelect("STRING_AGG(DISTINCT store.storeName, REPEAT(' ', 4))", 'From')
      .addSelect(
        "STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(' ', 4))",
        'To',
      )
      .addSelect('order.createdAt', 'Date')
      .addSelect('order.statusOrder', 'State')
      .groupBy('order.id')
      .orderBy('order.id', 'DESC')
      .getRawMany();
    //tab space with CHR() is

    return result;
  }
  async filterByDateState(date: string, state: StatusOrder) {
    const [fromDate, toDate] = date.split(' ');
    // Convert toDate to the end of the day
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.pharmacy', 'pharmacy')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .leftJoin('productInventory.store', 'store')
      .select('order.id', 'id')
      .addSelect("STRING_AGG(DISTINCT store.storeName, REPEAT(' ', 4))", 'From')
      .addSelect(
        "STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(' ', 4))",
        'To',
      )
      .addSelect('order.createdAt', 'Date')
      .addSelect('order.statusOrder', 'State')
      .where('order.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: new Date(fromDate),
        toDate: endOfDay,
      })
      .andWhere('order.statusOrder=:state', { state })
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
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.pharmacy', 'pharmacy')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .leftJoin('productInventory.store', 'store')
      .leftJoin('productInventory.product', 'product')
      .select('order.id', 'id')
      .addSelect("STRING_AGG(DISTINCT store.storeName, REPEAT(' ', 4))", 'From')
      .addSelect(
        "STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(' ', 4))",
        'To',
      )
      .addSelect('order.createdAt', 'Date')
      .addSelect('order.statusOrder', 'State')
      .addSelect(
        "STRING_AGG(DISTINCT CONCAT(pharmacy.address, pharmacy.region, pharmacy.governorate, pharmacy.country), ', ')",
        'Address',
      )
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
        'table',
      )
      .where('order.id = :id', { id: id })
      .groupBy('order.id')
      .getRawMany();

    // Helper function to convert date to 12-hour format

    // Transform the raw results into the desired JSON structure
    let TotalBeforeDescound = 0,
      TotalAfterDescound = 0;
    const finalResults = result.map((rawOrder) => {
      // Extract and transform the 'table' field into the desired structure
      const eeeeeParts = rawOrder.table.split('    '); // Split by the delimiter used in STRING_AGG
      const table = eeeeeParts.map((part) => {
        // Remove extra spaces from storeName

        const [
          productName,
          publicPrice,
          storeName,
          priceAfterOffer,
          offerPercent,
          quantity,
          price,
        ] = part.split('|');
        TotalBeforeDescound += parseFloat(publicPrice);
        TotalAfterDescound += parseFloat(priceAfterOffer);
        return {
          Product: productName,
          store: storeName,
          publicPrice: publicPrice,
          offer: offerPercent,
          Quantity: quantity,
          priceAfterOffer: priceAfterOffer,
          ProductTotal: price,
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
        TotalDescound:
          TotalBeforeDescound -
          TotalAfterDescound +
          '(' +
          (100 - (TotalAfterDescound / TotalBeforeDescound) * 100) +
          '%)',
      };
    });

    return finalResults;
  }
  private convertTo12HourFormat(date: Date): { date: string; time: string } {
    if (!date) {
      console.error('Date is undefined'); // Debugging log
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

  async getTotalOrdersCount(
    id: number,
    period: AllowedPeriods,
  ): Promise<{ count: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const whereCondetion = id !== 0 ? { pharmacy: { id: id } } : {};
      const totalCount = await this.orderRepository.count({
        where: whereCondetion,
      });
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
    try {
      //id==0 means all pharmacies

      const whereCurrent =
        id === 0
          ? { createdAt: Between(currentStartDate, currentEndDate) }
          : {
              pharmacy: { id: id },
              createdAt: Between(currentStartDate, currentEndDate),
            };
      const wherePrevious =
        id === 0
          ? { createdAt: Between(previousStartDate, previousEndDate) }
          : {
              pharmacy: { id: id },
              createdAt: Between(previousStartDate, previousEndDate),
            };

      const [currentCount, previousCount] = await Promise.all([
        this.orderRepository.count({
          where: whereCurrent,
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
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.ordersDetail', 'ordersDetail')
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

  async getLates() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.pharmacy', 'pharmacy')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .leftJoin('productInventory.store', 'store')
      .select('order.id', 'id')
      .addSelect("STRING_AGG(DISTINCT store.storeName, REPEAT(' ', 4))", 'From')
      .addSelect(
        "STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(' ', 4))",
        'To',
      )
      .addSelect('order.createdAt', 'Date')
      .addSelect('order.statusOrder', 'State')
      .groupBy('order.id')
      .orderBy('order.id', 'DESC')
      .limit(5)
      .getRawMany();
    //tab space with CHR() is
    return result.map((event) => ({
      ...event,
      Date:
        this.convertTo12HourFormat(event.Date).date +
        '   ' +
        this.convertTo12HourFormat(event.Date).time,
    }));
  }

  async findOrdersforOnePharmacy(id: number) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.pharmacy', 'pharmacy')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .leftJoin('productInventory.store', 'store')
      .select('order.id', 'id')
      .addSelect("STRING_AGG(DISTINCT store.storeName, REPEAT(' ', 4))", 'From')
      .addSelect(
        "STRING_AGG(DISTINCT pharmacy.pharmacyName, REPEAT(' ', 4))",
        'To',
      )
      .addSelect('order.createdAt', 'Date')
      .addSelect('order.statusOrder', 'State')
      .where('pharmacy.id=:id', { id: id })
      .groupBy('order.id')
      .orderBy('order.id', 'DESC')
      .getRawMany();

    return result.map((event) => ({
      ...event,
      Date:
        this.convertTo12HourFormat(event.Date).date +
        '   ' +
        this.convertTo12HourFormat(event.Date).time,
    }));
  }
  async getTotalBayingForOnePharmacy(
    id: number,
    period: AllowedPeriods,
  ): Promise<{ cost: number; percentageChange: number }> {
    if (period === AllowedPeriods.ALLTIME) {
      const whereCondetion = id !== 0 ? { pharmacy: { id: id } } : {};
      const totalCost = await this.orderRepository.sum(
        'totalCost',
        whereCondetion,
      );
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
    try {
      //id==0 means all pharmacies

      const whereCurrent =
        id === 0
          ? { createdAt: Between(currentStartDate, currentEndDate) }
          : {
              pharmacy: { id: id },
              createdAt: Between(currentStartDate, currentEndDate),
            };
      const wherePrevious =
        id === 0
          ? { createdAt: Between(previousStartDate, previousEndDate) }
          : {
              pharmacy: { id: id },
              createdAt: Between(previousStartDate, previousEndDate),
            };

      let [currentCost, previousCost] = await Promise.all([
        this.orderRepository.sum('totalCost', whereCurrent),
        this.orderRepository.sum('totalCost', wherePrevious),
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
        CalculationsHelper.calculatePercentageChange(currentCost, previousCost);
      return { cost: currentCost, percentageChange };
    } catch (error) {
      console.error('An error occurred while counting the orders:', error);
    }
  }

async getMostSoldProductInventory(location: string): Promise<any[]> {

  const query = await this.orderRepository.createQueryBuilder('order')
      .innerJoin('order.pharmacy', 'pharmacy')
      .innerJoin('order.ordersDetail', 'ordersDetail')
      .innerJoin('ordersDetail.productInventory', 'productInventory')
      .innerJoin('productInventory.product', 'product')
      .innerJoin('productInventory.store', 'store')
      .where('pharmacy.address ILIKE :location OR pharmacy.region ILIKE :location OR pharmacy.governorate ILIKE :location OR pharmacy.country ILIKE :location', { location: `%${location}%` })
      .select([
          'product.image AS image',
          'product.name AS name',
          'product.unitsPerPackage AS tablets',
          'product.activeIngredientInEachTablet AS activeIngredientInEachTablet',
          'product.publicPrice AS publicPrice',
          'productInventory.offerPercent AS offerPercent',
          'productInventory.priceAfterOffer AS priceAfterOffer',
          'store.storeName AS storeName'
      ])
      .addSelect('SUM(ordersDetail.quantity)', 'totalQuantity')
      .groupBy('productInventory.id, product.image, product.name, product.unitsPerPackage, product.activeIngredientInEachTablet, product.publicPrice, productInventory.offerPercent, productInventory.priceAfterOffer, store.storeName')
      .having('productInventory.amount > 0')
      .orderBy('SUM(ordersDetail.quantity)', 'DESC')
      .getRawMany();

  console.log(query); // Log the query result
   
  const result = query.map(event => ({
      name: event.name,
      tablets: event.activeingredientineachtablet + 'mg/ ' + event.tablets + 'Tablets',
      storeName: event.storename,
      publicPrice: event.publicprice,
      priceAfterOffer: event.priceafteroffer,
      offerPercent: event.offerpercent,
      image: event.image, // Convert image path to URL
  }));

  console.log(result); // Log the mapped result
  return result;
}
async dashboardTotalOrders(id:number,month:string,year:string){
  //convert charachter of month into number of month
  const {currentStartDate,currentEndDate,previousStartDate,previousEndDate}=this.getComparingDate(month,year);
 const whereCurrent =  { pharmacy: {id:id}, createdAt: Between(currentStartDate, currentEndDate) };
      const wherePrevious =  { pharmacy: {id:id}, createdAt: Between(previousStartDate, previousEndDate) };
    
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
      } 


 //cut year from month and add year for month 

 
//   currentEndDate = endOfMonth(new Date());
//   previousStartDate = startOfMonth(subMonths(new Date(), 1)); // Previous month
//   previousEndDate = endOfMonth(subMonths(new Date(), 1));
//   break;
// case AllowedPeriods.YEAR:
//   currentStartDate = startOfYear(new Date());
//   currentEndDate = endOfYear(new Date());
//   previousStartDate = startOfYear(subYears(new Date(), 1)); // Previous year
//   previousEndDate = endOfYear(subYears(new Date(), 1));

 async dashboardTotalAverageItemDescount(id:number,month:string,year:string){

  const {currentStartDate,currentEndDate,previousStartDate,previousEndDate}=this.getComparingDate(month,year);
  
  let currentDateresult = await this.orderRepository.createQueryBuilder('order')
  .innerJoin('order.pharmacy', 'pharmacy')
  .innerJoin('order.ordersDetail', 'orderDetail')
  .innerJoin('orderDetail.productInventory', 'productInventory')
  .select(' AVG(productInventory.offerPercent)', 'averageItemDescount') 
  .where('pharmacy.id=:id',{id:id})
  .andWhere('order.createdAt BETWEEN :currentStartDate AND :currentEndDate', { currentStartDate, currentEndDate })
  .getRawOne();
  let previousDateresult = await this.orderRepository.createQueryBuilder('order')
  .innerJoin('order.pharmacy', 'pharmacy')
  .innerJoin('order.ordersDetail', 'orderDetail')
  .innerJoin('orderDetail.productInventory', 'productInventory')
  .select(' AVG(productInventory.offerPercent)', 'averageItemDescount') 
  .where('pharmacy.id=:id',{id:id})
  .andWhere('order.createdAt BETWEEN :previousStartDate AND :previousEndDate', { previousStartDate, previousEndDate })
  .getRawOne();

 if( currentDateresult.averageItemDescount==null){
  currentDateresult.averageItemDescount=0;
 }
 if(previousDateresult.averageItemDescount==null){
  previousDateresult.averageItemDescount=0;
 }
   const percentageChange: number =
        CalculationsHelper.calculatePercentageChange(
          currentDateresult.averageItemDescount,
          previousDateresult.averageItemDescount,
        );
      return { averageItemDescount: currentDateresult.averageItemDescount+' %', percentageChange };
      }
// const query = await this.orderRepository.createQueryBuilder('order')
// .innerJoin('order.pharmacy', 'pharmacy')
// .innerJoin('order.ordersDetail', 'ordersDetail')
// .innerJoin('ordersDetail.productInventory', 'productInventory')
// .innerJoin('productInventory.product', 'product')
// .innerJoin('productInventory.store', 'store')
// .where('pharmacy.address ILIKE :location OR pharmacy.region ILIKE :location OR pharmacy.governorate ILIKE :location OR pharmacy.country ILIKE :location', { location: `%${location}%` })
// .select([
//     'product.image AS image',
//     'product.name AS name',
//     'product.unitsPerPackage AS tablets',
//     'product.activeIngredientInEachTablet AS activeIngredientInEachTablet',
//     'product.publicPrice AS publicPrice',
//     'productInventory.offerPercent AS offerPercent',
//     'productInventory.priceAfterOffer AS priceAfterOffer',
//     'store.storeName AS storeName'
// ])
// .addSelect('SUM(ordersDetail.quantity)', 'totalQuantity')
// .groupBy('productInventory.id, product.image, product.name, product.unitsPerPackage, product.activeIngredientInEachTablet, product.publicPrice, productInventory.offerPercent, productInventory.priceAfterOffer, store.storeName')
// .having('productInventory.amount > 0')
// .orderBy('SUM(ordersDetail.quantity)', 'DESC')
// .getRawMany();

async dashboardTotalItemBought(id:number,month:string,year:string){

  const {currentStartDate,currentEndDate,previousStartDate,previousEndDate}=this.getComparingDate(month,year);
  
  let currentDateresult = await this.orderRepository.createQueryBuilder('order')
  .innerJoin('order.pharmacy', 'pharmacy')
  .innerJoin('order.ordersDetail', 'orderDetail') 
  .select(' COUNT(orderDetail.id)', 'TotalItemBought') 
  .where('pharmacy.id=:id',{id:id})
  .andWhere('order.createdAt BETWEEN :currentStartDate AND :currentEndDate', { currentStartDate, currentEndDate })
  .getRawOne();
  let previousDateresult = await this.orderRepository.createQueryBuilder('order')
  .innerJoin('order.pharmacy', 'pharmacy')
  .innerJoin('order.ordersDetail', 'orderDetail') 
  .select(' COUNT(orderDetail.id)', 'TotalItemBought') 
  .where('pharmacy.id=:id',{id:id})
  .andWhere('order.createdAt BETWEEN :previousStartDate AND :previousEndDate', { previousStartDate, previousEndDate })
  .getRawOne();

 if( currentDateresult.TotalItemBought==null){
  currentDateresult.TotalItemBought=0;
 }
 if(previousDateresult.TotalItemBought==null){
  previousDateresult.TotalItemBought=0;
 }
   const percentageChange: number =
        CalculationsHelper.calculatePercentageChange(
          currentDateresult.TotalItemBought,
          previousDateresult.TotalItemBought,
        );
      return { TotalItemBought: currentDateresult.TotalItemBought, percentageChange };
      }
async dashboardTotalUnitsBought(id:number,month:string,year:string){

    const {currentStartDate,currentEndDate,previousStartDate,previousEndDate}=this.getComparingDate(month,year);

    let currentDateresult = await this.orderRepository.createQueryBuilder('order')
    .innerJoin('order.pharmacy', 'pharmacy')
    .innerJoin('order.ordersDetail', 'orderDetail') 
    .select(' SUM(orderDetail.quantity)', 'TotalUnitsBought') 
    .where('pharmacy.id=:id',{id:id})
    .andWhere('order.createdAt BETWEEN :currentStartDate AND :currentEndDate', { currentStartDate, currentEndDate })
    .getRawOne();
    let previousDateresult = await this.orderRepository.createQueryBuilder('order')
    .innerJoin('order.pharmacy', 'pharmacy')
    .innerJoin('order.ordersDetail', 'orderDetail') 
    .select(' SUM(orderDetail.quantity)', 'TotalUnitsBought') 
    .where('pharmacy.id=:id',{id:id})
    .andWhere('order.createdAt BETWEEN :previousStartDate AND :previousEndDate', { previousStartDate, previousEndDate })
    .getRawOne();

    if( currentDateresult.TotalUnitsBought==null){
    currentDateresult.TotalUnitsBought=0;
    }
    if(previousDateresult.TotalUnitsBought==null){
    previousDateresult.TotalUnitsBought=0;
    }
    const percentageChange: number =
      CalculationsHelper.calculatePercentageChange(
        currentDateresult.TotalUnitsBought,
        previousDateresult.TotalUnitsBought,
      );
    return { TotalUnitsBought: currentDateresult.TotalUnitsBought, percentageChange, };
}      
private getComparingDate(month:string,year:string){
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNumber = months.indexOf(month) + 1;

 const currentStartDate=new Date(year+startOfMonth(monthNumber+'').toISOString().substring(4));
 const currentEndDate= new Date(year+endOfMonth(monthNumber+'').toISOString().substring(4));

 const previousStartDate= new Date(year+startOfMonth((monthNumber-1)+'').toISOString().substring(4));
 const previousEndDate= new Date(year+endOfMonth((monthNumber-1)+'').toISOString().substring(4));

return {currentStartDate,currentEndDate,previousStartDate,previousEndDate};
}

async dashboardTotalpharmacistPrice(id:number){

  let  result = await this.orderRepository.createQueryBuilder('order')
  .innerJoin('order.pharmacy', 'pharmacy')
  .innerJoin('order.ordersDetail', 'orderDetail')
  .innerJoin('orderDetail.productInventory', 'productInventory')
  .select(' SUM(productInventory.priceAfterOffer * orderDetail.quantity)', 'averageItemDescount') 
  .where('pharmacy.id=:id',{id:id})
  .getRawOne();
   return result;
}
async dashboardTotalpharmacistPublicPrice(id:number){

  let  result = await this.orderRepository.createQueryBuilder('order')
  .innerJoin('order.pharmacy', 'pharmacy')
  .innerJoin('order.ordersDetail', 'orderDetail')
   .innerJoin('orderDetail.productInventory', 'productInventory')
  .innerJoin('productInventory.product', 'product')
  .select(' SUM(product.publicPrice * orderDetail.quantity)', 'averageItemDescount') 
  .where('pharmacy.id=:id',{id:id})
  .getRawOne();
   return result;
}
async getMostSolditemsForOnePharmacy(id: number): Promise<any[]> {

  const query = await this.orderRepository.createQueryBuilder('order')
      .innerJoin('order.pharmacy', 'pharmacy')
      .innerJoin('order.ordersDetail', 'ordersDetail')
      .innerJoin('ordersDetail.productInventory', 'productInventory')
      .innerJoin('productInventory.product', 'product')
      .innerJoin('productInventory.store', 'store')
      .where('pharmacy.id=:id',{id:id})
      .select([
          'product.image AS image',
          'product.name AS name',
          'product.unitsPerPackage AS tablets',
          'product.activeIngredientInEachTablet AS activeIngredientInEachTablet',
          'product.publicPrice AS publicPrice',
          'productInventory.offerPercent AS offerPercent',
          'productInventory.priceAfterOffer AS priceAfterOffer',
          'store.storeName AS storeName',
          'ordersDetail.quantity AS totalQuantity'
      ])
      .orderBy('ordersDetail.quantity', 'DESC')
      .limit(2)
      .getRawMany();

  const result = query.map(event => ({
      name: event.name,
      tablets: event.activeingredientineachtablet + 'mg/ ' + event.tablets + 'Tablets',
      storeName: event.storename,
      publicPrice: event.publicprice,
      priceAfterOffer: event.priceafteroffer,
      offerPercent: event.offerpercent,
      image: event.image, // Convert image path to URL
      totalQuantity: event.totalquantity
  }));

  return result;
}

async findOrdersforOnePharmacy_OrdersPage(id: number,state:string) {
  
  let orders = await this.orderRepository.createQueryBuilder('order')
    .leftJoinAndSelect('order.pharmacy', 'pharmacy')
    .leftJoinAndSelect('order.ordersDetail', 'orderDetail')
    .leftJoinAndSelect('orderDetail.productInventory', 'productInventory')
    .leftJoinAndSelect('productInventory.product', 'product')
    .where('pharmacy.id = :id', { id: id });
    
    
    if(state=='current'){
      orders= orders.andWhere('order.statusOrder IN (:...statuses)', { statuses: [StatusOrder.ONHOLD, StatusOrder.ONWAY] })
    }
    else { 
      orders= orders.andWhere('order.statusOrder IN (:...statuses)', { statuses: [StatusOrder.DELIVERED, StatusOrder.CANCELED] })
        }
     const  orderss = await orders.orderBy('order.id', 'DESC').getMany();
    let totalDescount = 0;
    let total = 0;
    let subTotal = 0;
    let numOrder=0;
    const result = orderss.map(order => {
      totalDescount = 0;
      total = 0;
      subTotal = 0;
      numOrder++;
      return {
      id: order.id,
      numOrder: numOrder,
      Date: this.convertTo12HourFormat(order.createdAt).date + ' ' + this.convertTo12HourFormat(order.createdAt).time,
      State: order.statusOrder,
      products: order.ordersDetail.map(detail => {
        
        const productPrice = typeof detail.productInventory.product.publicPrice === 'string' ? parseFloat(detail.productInventory.product.publicPrice) : detail.productInventory.product.publicPrice;
        const priceAfterOffer = typeof detail.productInventory.priceAfterOffer === 'string' ? parseFloat(detail.productInventory.priceAfterOffer) : detail.productInventory.priceAfterOffer;
  
        subTotal += productPrice* detail.quantity;
        
        total += priceAfterOffer* detail.quantity;

        totalDescount += (productPrice - priceAfterOffer) * detail.quantity;

        return {
          name: detail.productInventory.product.name,
          quantity: detail.quantity,
          Price: productPrice.toString() // Convert back to string if necessary
        };
      })
      ,subTotal
      ,totalDescount:totalDescount+'('+ (totalDescount*100/subTotal)+' %)'
      ,total
      }
 
});
    
    return {...result};
}
  
    /**
   * Retrieve orders associated with a specific store by store ID.
   *
   * @param storeId - The ID of the store.
   * @return An array of grouped orders.
   */
  async getOrdersByStoreId(storeId: number) {
    const store = await this.storeService.findOne(storeId);

    const orders = await this.orderRepository.find({
      relations: [
        'ordersDetail',
        'ordersDetail.productInventory',
        'ordersDetail.productInventory.store',
        'ordersDetail.productInventory.product',
        'pharmacy',
      ],
    });

    const groupedOrders = orders
      .filter((order) =>
        order.ordersDetail.some(
          (detail) => detail.productInventory?.store?.id === storeId,
        ),
      )
      .map((order) => ({
        from: store.storeName,
        to: order.pharmacy.pharmacyName,
        orderStatus: order.statusOrder,
        createDate: order.createdAt,
      }));

    return groupedOrders;

  }

  /**
   * Retrieve the number of orders for a specific store within a given period and calculate
   * the rate of change in the number of orders compared to the previous equivalent period
   * @param storeId - The ID of the store.
   * @param period - The desired period (day, week, month, year).
   * @returns An object containing current period orders, previous period orders, and change rate.
   */
  async getStoreOrderStatistics(storeId: number, period: AllowedPeriods) {
    const isExistingStore = await this.storeService.findOne(storeId);

    const {
      currentStartDate,
      currentEndDate,
      previousStartDate,
      previousEndDate,
    } = CalculationsHelper.calculateDateRanges(period);

    const currentPeriodOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .where('productInventory.storeId = :storeId', { storeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate: currentStartDate,
        endDate: currentEndDate,
      })
      .getCount();

    const previousPeriodOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.ordersDetail', 'orderDetail')
      .leftJoin('orderDetail.productInventory', 'productInventory')
      .where('productInventory.storeId = :storeId', { storeId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate: previousStartDate,
        endDate: previousEndDate,
      })
      .getCount();

    const changeRate = CalculationsHelper.calculatePercentageChange(
      currentPeriodOrders,
      previousPeriodOrders,
    );

    return {
      currentPeriodOrders,
      previousPeriodOrders,
      changeRate,
    };
  }
}
