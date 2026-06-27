import { Request } from 'express';
import { User } from '@/modules/users/models/user.model'; // adjust path if needed

export interface RequestWithUser extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    role_id: string;
  };
}
