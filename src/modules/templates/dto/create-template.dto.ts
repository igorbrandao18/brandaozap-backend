import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { TemplateCategory } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsObject()
  flowData: any;

  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
