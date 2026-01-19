import { Module } from '@nestjs/common';
import { KeywordsController } from './keywords.controller';
import { KeywordsService } from './keywords.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [KeywordsController],
  providers: [KeywordsService],
  exports: [KeywordsService],
})
export class KeywordsModule {}
