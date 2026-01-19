import { IsString, IsOptional, IsEmail, IsObject } from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}
