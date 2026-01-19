import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  to: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
