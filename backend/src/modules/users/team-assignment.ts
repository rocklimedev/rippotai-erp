import { BadRequestException } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { Role } from '../rbac/models/role.model';
import { User } from './models/user.model';

export async function validateAssignment(
  userId: string,
  label: string | null | undefined,
  scope: 'INTERNAL' | 'PROJECT',
  transaction?: Transaction,
) {
  const user = await User.findByPk(userId, { transaction });
  if (!user?.is_active)
    throw new BadRequestException('Team members must be active users');
  const name = label?.trim();
  if (!name || name.length > 50)
    throw new BadRequestException('A valid role label is required');
  const role = await Role.findOne({ where: { name, scope }, transaction });
  if (!role)
    throw new BadRequestException(
      `Unknown ${scope.toLowerCase()} role: ${name}`,
    );
  return role.name;
}
