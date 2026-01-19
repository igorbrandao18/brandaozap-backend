import { IsString, IsOptional, IsEmail, IsObject } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}
