import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { Note } from './note.model';

const FIELDS = ['title', 'body', 'project_id', 'client_id', 'category', 'tone', 'pinned', 'is_shared'];
const pick = (b: any) => {
  const out: any = {};
  for (const k of FIELDS) if (b?.[k] !== undefined) out[k] = b[k] === '' ? null : b[k];
  return out;
};

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(@InjectModel(Note) private readonly notes: typeof Note) {}

  @Get()
  async list(
    @CurrentUser() user: any,
    @Query('q') q?: string,
    @Query('project_id') project_id?: string,
    @Query('client_id') client_id?: string,
    @Query('category') category?: string,
    @Query('scope') scope?: string,
  ) {
    const where: any = {
      [Op.or]: [{ is_shared: true }, { created_by: user?.id }],
    };
    if (scope === 'mine') where.created_by = user?.id;
    if (project_id) where.project_id = project_id;
    if (client_id) where.client_id = client_id;
    if (category) where.category = category;
    if (q) where[Op.and] = [{ [Op.or]: [{ title: { [Op.like]: `%${q}%` } }, { body: { [Op.like]: `%${q}%` } }] }];
    return this.notes.findAll({ where, order: [['pinned', 'DESC'], ['updated_at', 'DESC']], limit: 500 });
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    const n = await this.notes.findByPk(id);
    if (!n) throw new NotFoundException('Note not found');
    return n;
  }

  @Post()
  async create(@Body() body: any, @CurrentUser() user: any) {
    const data = pick(body);
    if (!data.title || !String(data.title).trim()) throw new BadRequestException('Title is required');
    return this.notes.create({ ...data, created_by: user?.id ?? null });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const n = await this.one(id);
    const data = pick(body);
    if (data.title !== undefined && !String(data.title).trim()) throw new BadRequestException('Title is required');
    await n.update(data);
    return n;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const n = await this.one(id);
    await n.destroy();
    return { deleted: true };
  }
}
