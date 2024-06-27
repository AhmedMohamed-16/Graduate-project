 
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import {   DataSource, Repository } from 'typeorm'; 
import { InjectRepository } from '@nestjs/typeorm'; 
import { ProductInventoryService } from 'src/product-inventory/product-inventory.service';
import { OrderDetail } from './entities/order-details.entity';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
 
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.entity'; 
import { HttpAdapterHost } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express'; 
import { ProductInventory } from 'src/product-inventory/entities/product-inventory.entity';
@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orderRepository:Repository<Order>,
  @InjectRepository(OrderDetail) private readonly orderDetailRepository:Repository<OrderDetail>,
  private readonly productInventoryService:ProductInventoryService,
 
  private readonly pharmacyService:PharmacyService,
  private readonly dataSource:DataSource,
  private readonly httpAdapterHost: HttpAdapterHost<ExpressAdapter>){}

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

  findAll() {
    return this.orderRepository.find() ;
  }

  async findOne(id: number) {
   const order=await this.orderRepository.findOne({where:{id} 
    ,relations:['pharmacy','ordersDetail','ordersDetail.productInventory']});
  }

  async findOneUser(id:number){
   const pharmacy=await this.pharmacyService.findOne(id); 
    return pharmacy;
  }
  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  } 
}
