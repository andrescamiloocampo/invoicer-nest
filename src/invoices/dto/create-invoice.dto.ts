export class CreateInvoiceDto {
  name: string;
  amount: number;
  transactionType: 'income' | 'outcome';
  transactionDate: string; // ISO 8601 o formato de fecha
}
