import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { KeywordMatchType } from '@prisma/client';

export class CreateKeywordDto {
  @IsString()
  keyword: string;

  @IsString()
  response: string;

  @IsOptional()
  @IsEnum(KeywordMatchType)
  matchType?: KeywordMatchType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}
