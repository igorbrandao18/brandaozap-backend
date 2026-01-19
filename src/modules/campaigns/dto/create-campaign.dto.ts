import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  message: string;

  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
