export class ListNotificationsDto {
  page?: number = 1;
  limit?: number = 20;
  read?: '0' | '1';
  category?: string;
  before?: string; // ISO
}


