import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DynamoService } from './dynamo/dynamo.service';
import { DynamoModule } from './dynamo/dynamo.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DynamoModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService, DynamoService],
})
export class AppModule {}
