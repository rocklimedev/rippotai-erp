import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TasksService } from './task.service';
import { CrucialTaskCheck } from './models/crucial-task-check.model';
import { User } from '../users/models/user.model';
import { CrucialWorkQueryDto, SaveCrucialCheckDto } from './dto/crucial-work.dto';

export const indiaDate = (value: string | Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value));

export function cycleEnd(query: CrucialWorkQueryDto) {
  const date = new Date(`${query.cycle_date}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (query.cycle === 'weekly' ? 6 : 0));
  return date.toISOString().slice(0, 10);
}

export function checklistTasks(tasks: any[], checks: any[], query: CrucialWorkQueryDto) {
  const end = cycleEnd(query);
  const checkedIds = new Set(checks.map(c => c.task_id));
  return tasks.filter(t => checkedIds.has(t.id) || (t.status !== 'completed' &&
    (!t.due_date || indiaDate(t.due_date) <= end)));
}

@Injectable()
export class CrucialWorkService {
  constructor(private readonly tasks: TasksService,
    @InjectModel(CrucialTaskCheck) private readonly checks: typeof CrucialTaskCheck) {}

  async register(query: CrucialWorkQueryDto) {
    const [tasks, checks] = await Promise.all([
      this.tasks.findAll({ is_crucial: true, project_id: query.project_id }),
      this.checks.findAll({ where: { cycle_date: query.cycle_date, cycle: query.cycle },
        include: [{ model: User, as: 'checker', attributes: ['id', 'name'] }] }),
    ]);
    const master = tasks.map(t => t.toJSON()).sort((a, b) => a.crucial_ref - b.crucial_ref);
    const ids = new Set(master.map(t => t.id));
    const cycleChecks = checks.map(c => c.toJSON()).filter(c => ids.has(c.task_id));
    return { tasks: master, checks: cycleChecks,
      checklist: checklistTasks(master, cycleChecks, query), cycle_end: cycleEnd(query) };
  }

  async saveCheck(taskId: string, dto: SaveCrucialCheckDto, actorId: string) {
    const task = await this.tasks.findOne(taskId);
    if (!task.is_crucial) throw new BadRequestException('Mark this task as Crucial Work before checking it.');
    const where = { task_id: taskId, cycle_date: dto.cycle_date, cycle: dto.cycle };
    await this.checks.upsert({ ...where, check_status: dto.check_status,
      follow_up: dto.follow_up?.trim() || null, checked_by: actorId });
    return this.checks.findOne({ where, include: [{ model: User, as: 'checker', attributes: ['id', 'name'] }] });
  }
}
