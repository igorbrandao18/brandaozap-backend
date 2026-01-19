import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
