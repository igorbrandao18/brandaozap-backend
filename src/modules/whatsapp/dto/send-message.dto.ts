import { IsString, IsOptional } from 'class-validator';

export class SendTextDto {
  @IsString()
  to: string;

  @IsString()
  text: string;
}

export class SendImageDto {
  @IsString()
  to: string;

  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class SendFileDto {
  @IsString()
  to: string;

  @IsString()
  fileUrl: string;

  @IsString()
  filename: string;
}
