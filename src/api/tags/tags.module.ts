import { Module } from '@nestjs/common';
import { TagsResolver } from './tags.resolver';
import { TagsService } from './tags.service';

@Module({
  providers: [
    TagsResolver, //
    TagsService,
  ],
})
export class TagsModule {}