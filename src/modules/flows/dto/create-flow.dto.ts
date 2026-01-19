import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  nodes: any[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  edges: any[];
}
