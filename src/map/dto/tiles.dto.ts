import { ArrayMinSize, IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class TilesQueryDto {
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray() 
  @ArrayMinSize(1)
  tiles!: string[];

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt() 
  @Min(6) 
  @Max(16)
  level!: number;

  @IsOptional()
  filters?: {
    search?: string;
    types?: string[];
    categories?: string[];
    unitStatuses?: string[];
    cities?: string[];
    ownerRole?: string;
    developerId?: string;
    brokerId?: string;
    projectId?: string;
    minPrice?: number;
    maxPrice?: number;
    minSpace?: number;
    maxSpace?: number;
  };
}
