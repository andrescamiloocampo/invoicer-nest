import { Body, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DynamoService } from '../dynamo/dynamo.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Express } from 'express';

import {
  PutCommand,
  BatchWriteCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { s3 } from 'src/aws.config';
import { PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class InvoicesService {
  private readonly tableName = 'Invoices';

  constructor(private readonly dynamoService: DynamoService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const item = {
      id: uuidv4(),
      name: createInvoiceDto.name,
      amount: createInvoiceDto.amount,
      transactionType: createInvoiceDto.transactionType,
      transactionDate: new Date(createInvoiceDto.transactionDate).toISOString(),
    };

    await this.dynamoService.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );

    return item;
  }

  async createMany(createInvoiceDtos: CreateInvoiceDto[]) {
    const items = createInvoiceDtos.map((dto) => ({
      id: uuidv4(),
      name: dto.name,
      amount: dto.amount,
      transactionType: dto.transactionType,
      transactionDate: new Date(dto.transactionDate).toISOString(),
    }));

    const putRequests = items.map((item) => ({
      PutRequest: { Item: item },
    }));

    const BATCH_SIZE = 25;
    for (let i = 0; i < putRequests.length; i += BATCH_SIZE) {
      const batch = putRequests.slice(i, i + BATCH_SIZE);
      await this.dynamoService.docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: batch,
          },
        }),
      );
    }

    return items;
  }

  async findAll() {
    const result = await this.dynamoService.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
      }),
    );
    return result.Items;
  }

  async findOne(id: string) {
    const result = await this.dynamoService.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return result.Item;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, string | number> = {};
    const expressionAttributeNames: Record<string, string> = {};

    for (const [key, value] of Object.entries(updateInvoiceDto)) {
      if (value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] =
          key === 'transactionDate' && typeof value === 'string'
            ? new Date(value).toISOString()
            : String(value);
        expressionAttributeNames[`#${key}`] = key;
      }
    }

    if (updateExpression.length === 0) {
      return { message: 'No fields to update' };
    }

    await this.dynamoService.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
      }),
    );

    return { id, ...updateInvoiceDto };
  }

  async remove(id: string) {
    await this.dynamoService.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return { message: `Invoice ${id} deleted` };
  }

  async uploadFile(file: Express.Multer.File) {
    const Key = `${uuidv4()}-${file.originalname}`;
    const uploadParams = {
      Bucket: 'superinvoicer-uploads',
      Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));
    return {
      url: `https://superinvoicer-uploads.s3.amazonaws.com/${Key}`,
    };
  }
}
