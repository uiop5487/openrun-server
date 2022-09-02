import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthAccessGuard } from 'src/commons/auth/gql-auth.guard';
import { IContext } from 'src/commons/types/type';
import { InquiriesService } from '../inquiries/inquiries.service';
import { UsersService } from '../users/users.service';
import { InquiryAnswer } from './entities/inquiryAnswer.entity';
import { InquiriesAnswerService } from './inquiriesAnswer.service';

@Resolver()
export class InquiriesAnswerResolver {
  constructor(
    private readonly inquiriesAnswerService: InquiriesAnswerService,
    private readonly inquiriesService: InquiriesService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => InquiryAnswer)
  async createInquiryAnswer(
    @Args('inquiryId') inquiryId: string, //
    @Args('contents') contents: string,
    @Context() context: IContext,
  ) {
    const user = context.req.user;

    const result = await this.usersService.findOne({
      email: user.email,
    });

    if (!result.isAdmin) throw new NotFoundException('관리자가 아닙니다.');

    const inquiry = await this.inquiriesService.findOne({ inquiryId });

    return this.inquiriesAnswerService.create({ inquiry, contents });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [InquiryAnswer])
  async fetchLoginUserInquiryAnswer(
    @Args('inquiryId') inquiryId: string, //
  ) {
    const inquiry = await this.inquiriesService.findOne({ inquiryId });

    return this.inquiriesAnswerService.findAllByInquiry({ inquiry });
  }
}
