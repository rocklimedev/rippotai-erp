import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PERMISSION_KEY } from '@/common/decorator/require-permission.decorator';
import { assertDocumentTypeAccess } from '@/common/security/document-type-access';
import { Document } from './models/document.model';

@Injectable()
export class DocumentTypeAccessGuard implements CanActivate {
  constructor(@InjectModel(Document) private readonly documents: typeof Document) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user, params } = context.switchToHttp().getRequest();
    if (!params?.id || !Object.keys(user?.document_type_access ?? {}).length) return true;
    const document = await this.documents.findByPk(params.id, { attributes: ['documentTypeId'] });
    const permission: string = Reflect.getMetadata(PERMISSION_KEY, context.getHandler());
    assertDocumentTypeAccess(user, document?.documentTypeId, permission.split(':')[1]);
    return true;
  }
}
