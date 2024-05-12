import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.catRepo.findOne({
      where: { name: createCategoryDto.name.toUpperCase() },
    });

    if (!existingCategory) {
      const category = this.catRepo.create({
        ...createCategoryDto,
        name: createCategoryDto.name.toUpperCase(),
        createdAt: new Date(),
      });
      return await this.catRepo.save(category);
    }
    throw new ConflictException('Category already exists');
  }

  async findAll(): Promise<Category[]> {
    return await this.catRepo.find();
  }

  async findById(id: number): Promise<Category> {
    const category = await this.catRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findByName(catName: string): Promise<Category> {
    const category = await this.catRepo.findOne({
      where: { name: catName.toUpperCase() },
    });
    return;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto):Promise<Category> {  
    const updatedCategory = await this.findById( id );

     await this.catRepo.update(id, updateCategoryDto);

     return updatedCategory;
  }

  async remove(id: number): Promise<void> {
    const result = await this.catRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
  }
}
