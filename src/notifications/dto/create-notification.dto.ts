export class CreateNotificationDto {
  title!: string;
  body!: string;
  userIds!: string[];
  category?: string;
  data?: any;
}


