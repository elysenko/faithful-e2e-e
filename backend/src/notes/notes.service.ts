import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class NotesService {
  private readonly logger = new Logger('NotesService');

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateNoteDto) {
    try {
      return await this.prisma.note.create({
        data: {
          title: dto.title,
          body: dto.body,
          done: dto.done ?? false,
          userId,
        },
      });
    } catch (error) {
      this.logger.error(`POST: notes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findAll(userId: string) {
    try {
      return await this.prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`GET: notes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async findOne(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    // Ensures ownership before mutating (throws NotFound otherwise).
    await this.findOne(userId, id);

    try {
      return await this.prisma.note.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.prismaErrorHandler(error, 'PATCH', id);
      this.logger.error(`PATCH: notes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async remove(userId: string, id: string) {
    // Ensures ownership before deleting (throws NotFound otherwise).
    await this.findOne(userId, id);

    try {
      await this.prisma.note.delete({ where: { id } });
      return { message: 'Note deleted' };
    } catch (error) {
      this.prismaErrorHandler(error, 'DELETE', id);
      this.logger.error(`DELETE: notes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  private prismaErrorHandler = (error: any, method: string, value: string | null = null) => {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      this.logger.warn(`${method}: Note not found: ${value}`);
      throw new NotFoundException('Note not found');
    }
  };
}
