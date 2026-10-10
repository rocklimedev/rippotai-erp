import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

import { LibraryService } from './library.service';
import {
  CreateLibraryCategoryDto,
  CreateLibraryItemDto,
  QueryLibraryItemsDto,
  UpdateLibraryItemDto,
} from './dto/library-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @RequirePermission('library:read')
  @Get('categories')
  findCategories() {
    return this.libraryService.findCategories();
  }

  @RequirePermission('library:create')
  @Post('categories')
  createCategory(@Body() dto: CreateLibraryCategoryDto) {
    return this.libraryService.createCategory(dto);
  }

  @RequirePermission('library:read')
  @Get('items')
  findItems(@Query() query: QueryLibraryItemsDto) {
    return this.libraryService.findItems(query);
  }

  @RequirePermission('library:read')
  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.libraryService.findOneItem(id);
  }

  @RequirePermission('library:create')
  @Post('items')
  createItem(@Body() dto: CreateLibraryItemDto, @CurrentUser() user?: User) {
    return this.libraryService.createItem(dto, user?.id);
  }

  @RequirePermission('library:update')
  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateLibraryItemDto,
    @CurrentUser() user?: User,
  ) {
    return this.libraryService.updateItem(id, dto, user?.id);
  }

  @RequirePermission('library:delete')
  @Delete('items/:id')
  removeItem(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.libraryService.removeItem(id, user?.id);
  }
}
