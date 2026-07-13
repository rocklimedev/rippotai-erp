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

  @Get('categories')
  findCategories() {
    return this.libraryService.findCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateLibraryCategoryDto) {
    return this.libraryService.createCategory(dto);
  }

  @Get('items')
  findItems(@Query() query: QueryLibraryItemsDto) {
    return this.libraryService.findItems(query);
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.libraryService.findOneItem(id);
  }

  @Post('items')
  createItem(@Body() dto: CreateLibraryItemDto, @CurrentUser() user?: User) {
    return this.libraryService.createItem(dto, user?.id);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateLibraryItemDto,
    @CurrentUser() user?: User,
  ) {
    return this.libraryService.updateItem(id, dto, user?.id);
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.libraryService.removeItem(id, user?.id);
  }
}
