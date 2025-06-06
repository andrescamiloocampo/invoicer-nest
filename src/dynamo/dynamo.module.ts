import { Module, OnModuleInit } from '@nestjs/common';
import { DynamoService } from './dynamo.service';
import { InvoiceSchema } from 'src/invoices/entities/invoice.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [DynamoService],
  exports: [DynamoService],
})
export class DynamoModule implements OnModuleInit {
  constructor(private readonly dynamoService: DynamoService) {}

  async onModuleInit() {
    await this.dynamoService.createTable(InvoiceSchema);
  }
}
