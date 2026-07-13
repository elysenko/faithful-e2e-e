import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [NotesController],
  providers: [NotesService],
  imports: [AuthModule, PrismaModule],
  exports: [],
})
export class NotesModule {}
