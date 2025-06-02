import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoService {
  public readonly client: DynamoDBClient;
  public readonly docClient: DynamoDBDocumentClient;

  constructor(private configService: ConfigService) {
    this.client = new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        )!,
      },
      endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT')!,
    });

    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  getClient() {
    return this.client;
  }

  async createTable(params: any) {
    try {
      await this.client.send(new CreateTableCommand(params));
      console.log(`Table ${params.TableName} created`);
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log(`Table ${params.TableName} already exists`);
      } else {
        throw error;
      }
    }
  }
}
