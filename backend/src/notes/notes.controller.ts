import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/user/entities/user.entity';

@ApiBearerAuth()
@ApiTags('Notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({
    summary: 'CREATE NOTE',
    description: 'Private endpoint to create a note owned by the authenticated user.',
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth()
  create(@Body() createNoteDto: CreateNoteDto, @GetUser() user: User) {
    return this.notesService.create(user.id, createNoteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'GET ALL NOTES',
    description: 'Private endpoint to list the notes owned by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth()
  findAll(@GetUser() user: User) {
    return this.notesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'GET NOTE BY ID',
    description: 'Private endpoint to get one of the authenticated user own notes by id.',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Auth()
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.notesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'UPDATE NOTE BY ID',
    description: 'Private endpoint to update one of the authenticated user own notes.',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Auth()
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @GetUser() user: User
  ) {
    return this.notesService.update(user.id, id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'DELETE NOTE BY ID',
    description: 'Private endpoint to delete one of the authenticated user own notes.',
  })
  @ApiOkResponse({ content: { 'application/json': { example: { message: 'Note deleted' } } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Auth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.notesService.remove(user.id, id);
  }
}
