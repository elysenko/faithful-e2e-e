import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    description: 'Note title',
    nullable: false,
    required: true,
    type: 'string',
    maxLength: 120,
    example: 'Groceries',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiProperty({
    description: 'Note body',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Milk, eggs, bread',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Whether the note is marked as done',
    nullable: false,
    required: false,
    default: false,
    type: 'boolean',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  done?: boolean;
}
