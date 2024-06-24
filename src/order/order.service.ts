import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm'; 
import { ProductInventoryService } from 'src/product-inventory/product-inventory.service';
import { OrderDetail } from './entities/order-details.entity';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';

@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orderRepository:Repository<Order>,
  @InjectRepository(OrderDetail) private readonly orderDetailRepository:Repository<OrderDetail>,
  private readonly productInventoryService:ProductInventoryService,
  private readonly pharmacyService:PharmacyService){}

  async create(id:number,createOrderDto: CreateOrderDto) {

    if(createOrderDto.ProductInventoryId.length != createOrderDto.quantity.length) {
      throw new BadRequestException('The length of products and qty do not match') ;
  }
        const productInventory=await this.productInventoryService.findALLByIDS(createOrderDto.ProductInventoryId);
        let totalCost=0;
        let orderDetails:OrderDetail[];
         for (let i = 0; i < productInventory.length; i++) {
         if(productInventory[0].amount<createOrderDto.quantity[i]) {
          throw new BadRequestException(`the amount for this id product ${productInventory[i].product.id} must be greater than or equal from demand quantity`) ;
         }
         const amount=productInventory[i].amount-createOrderDto.quantity[i];
         await this.productInventoryService.update( productInventory[i].id,{amount});//update amount
         
         const publicPrice=productInventory[i].product.publicPrice;
         const price=publicPrice*(publicPrice-(productInventory[i].offerPercent/100));

        const orderDetail =  this.orderDetailRepository.create({productInventory:productInventory[i],quantity:createOrderDto.quantity[i],price});
        await this.orderDetailRepository.save(orderDetail );
        orderDetails.push(orderDetail);
        totalCost+=price;
        }

        
        const pharmacy=await this.pharmacyService.findOne(id);
      
       
        // PriceAfterOffer: number; ->detail
   
    // quantity: number;-> detail

  //   totalCost:number;
 
  //  statusOrder:StatusOrder; 
 
  //  paymentMethod:PaymentMethod ; 
   
  // pharmacy:Pharmacy;
     const order= this.orderRepository.create({totalCost,paymentMethod:createOrderDto.paymentMethod,pharmacy,orderDetail:orderDetails});
     return await this.orderRepository.save(order);
      
  }

  findAll() {
    return this.orderRepository.find() ;
  }

  async findOne(id: number) {
   const order=await this.orderRepository.findOne({where:{id}
    ,relations:['pharmacy','orderDetail','orderDetail.productInventory']});
  }

  async findOneUser(id:number){
   const pharmacy=await this.pharmacyService.getOrdersByID(id);
    return pharmacy;
  }
  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
