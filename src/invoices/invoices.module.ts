import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { DynamoModule } from 'src/dynamo/dynamo.module';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService],
  imports: [DynamoModule],
})
export class InvoicesModule {}
