import {
  ConflictException,
  Injectable,
  NotAcceptableException,
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
      });
      return await this.catRepo.save(category);
    }
    throw new ConflictException('Category already exists');
  }

  async findAll(): Promise<Category[]> {
    const category = await this.catRepo
      .createQueryBuilder('category')
      .select(['category.id', 'category.name', 'category.description'])
      .getMany();

    return category;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.catRepo.findOneBy({ id });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findById(id: number): Promise<Category> {
    // const category = await this.catRepo
    //   .createQueryBuilder('category')
    //   .select(['category.id', 'category.name', 'category.description'])
    //   .where('category.id = :id', { id })
    //   .getRawOne();

    // if (!category) {
    //   throw new NotFoundException(`Category with id ${id} not found`);
    // }
    return await this.catRepo.findOne({
      where: { id },
    });

  }

  async findByName(name: string): Promise<Category> {
    const categoryName = name.toUpperCase();
    const category = await this.catRepo
      .createQueryBuilder('category')
      .select(['category.id', 'category.name', 'category.description'])
      .where('category.name = :name', { name: categoryName })
      .getRawOne();

    if (!category) {
      throw new NotFoundException(`Category with name ${name} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const updatedCategory = await this.findById(id);

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
