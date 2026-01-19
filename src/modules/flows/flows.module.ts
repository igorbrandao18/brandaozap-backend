import { Module } from '@nestjs/common';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [FlowsController],
  providers: [FlowsService],
  exports: [FlowsService],
})
export class FlowsModule {}
