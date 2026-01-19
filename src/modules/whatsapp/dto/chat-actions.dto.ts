import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class ArchiveChatDto {
  @IsString()
  chatId: string;
}

export class UnarchiveChatDto {
  @IsString()
  chatId: string;
}

export class DeleteChatDto {
  @IsString()
  chatId: string;
}

export class MarkAsReadDto {
  @IsString()
  chatId: string;
}

export class GetMessagesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
}
