import { IsNumber, IsOptional } from 'class-validator';

export class ProductFiltersDto {
  @IsOptional()
  @IsNumber()
  startRange?: number;

  @IsOptional()
  @IsNumber()
  endRange?: number;
  
  @IsOptional()
  @IsNumber()
  categoryId?: number;
}
