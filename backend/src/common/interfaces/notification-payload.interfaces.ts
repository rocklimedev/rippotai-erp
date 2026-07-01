import { NotificationType } from '@/common/enums';

export interface NotificationPayload {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read?: boolean;
  created_at?: Date;
}
