import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PharmacistService } from './pharmacist.service';
import { CreatePharmacistDto } from './dto/create-pharmacist.dto';
import { UpdatePharmacistDto } from './dto/update-pharmacist.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pharmacist')
 
@Controller('pharmacists')
export class PharmacistController {
  constructor(private readonly pharmacistService: PharmacistService) {}

  @Post()  
  create(@Body() createPharmacistDto: CreatePharmacistDto) {
    return this.pharmacistService.create(createPharmacistDto);
  }

  @Get()
  findAll() {
    return this.pharmacistService.findAll();
  }

  @Get(':licenseNumber')
  findOne(@Param('licenseNumber') licenseNumber: string) {
    return this.pharmacistService.findOne(licenseNumber);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePharmacistDto: UpdatePharmacistDto) {
    return this.pharmacistService.update(+id, updatePharmacistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pharmacistService.remove(+id);
  }
}
