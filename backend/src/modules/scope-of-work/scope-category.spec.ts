import { validate } from 'class-validator';
import { CreateScopeCategoryDto } from './dto/create-scope-category.dto';
import { ScopeOfWorkService } from './scope-of-work.service';

describe('optional scope category slug', () => {
  it('accepts a category without a slug and rejects invalid supplied slugs', async () => {
    const dto = Object.assign(new CreateScopeCategoryDto(), { name: 'Civil work' });
    expect(await validate(dto)).toEqual([]);
    Object.assign(dto, { slug: 123 });
    expect((await validate(dto)).some((error) => error.property === 'slug')).toBe(true);
  });

  it.each([undefined, null, '', '   '])('stores missing or blank slug %p as null', async (slug) => {
    const service = Object.create(ScopeOfWorkService.prototype);
    service.scopeCategoryModel = { create: jest.fn().mockResolvedValue({ id: 'category' }) };
    await service.createCategory({ name: 'Civil work', slug });
    expect(service.scopeCategoryModel.create).toHaveBeenCalledWith({ name: 'Civil work', slug: null });
  });

  it('preserves the existing slug when updating only the name', async () => {
    const service = Object.create(ScopeOfWorkService.prototype);
    const category = { update: jest.fn().mockResolvedValue(undefined) };
    service.findCategoryById = jest.fn().mockResolvedValue(category);
    await service.updateCategory('category', { name: 'Renamed' });
    expect(category.update).toHaveBeenCalledWith({ name: 'Renamed' });
    await service.updateCategory('category', { slug: '' });
    expect(category.update).toHaveBeenLastCalledWith({ slug: null });
  });
});
