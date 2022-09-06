import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput } from './dto/createUser.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateUserInput } from './dto/updateUser.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthAccessGuard } from 'src/commons/auth/gql-auth.guard';
import { IContext } from 'src/commons/types/type';

@Resolver()
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService, //
  ) {}

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [User])
  fetchUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => User)
  fetchLoginUser(@Context() context: IContext) {
    const email = context.req.user.email;
    return this.usersService.findOne({ email });
  }

  @Query(() => [User])
  fetchBestOfUser() {
    return this.usersService.findFourByRating();
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => [User])
  async fetchAdmin(
    @Context() context: IContext, //
  ) {
    const email = context.req.user.email;

    //admin 여부 확인
    await this.usersService.checkIsAdmin({ email });

    //admin 모두 찾기
    return this.usersService.findAllAdmin();
  }

  @UseGuards(GqlAuthAccessGuard)
  @Query(() => Int)
  async fetchUsersCount(
    @Context() context: IContext, //
  ) {
    const email = context.req.user.email;
    //admin 여부 확인
    await this.usersService.checkIsAdmin({ email });

    //총 유저 수 출력
    return this.usersService.findNumberOfUsers();
  }

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput, //
  ) {
    //유저가 존재하는지 확인
    await this.usersService.checkIsUserAvailable({
      email: createUserInput.email,
    });

    //닉네임이 존재하는지 확인
    await this.usersService.checkIsNickNameAvailable({
      nickName: createUserInput.nickName,
    });

    //패스워드 Encrypt
    const { password, ...user } = createUserInput;
    const hashedPwd = await this.usersService.encryptPassword({ password });

    //유저 생성
    return this.usersService.create({
      _user: user,
      hashedPwd,
    });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => User)
  updateLoginUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput, //
  ) {
    return this.usersService.updateUser({ updateUserInput });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean)
  deleteLoginUser(@Context() context: IContext) {
    const email = context.req.user.email;
    return this.usersService.delete({ email });
  }

  @UseGuards(GqlAuthAccessGuard)
  @Mutation(() => Boolean) //굳이 user를 반환해줘야하나..?(여기서는 runner를 점수매기는 것이기 때문에 user필요없을 듯)
  createRating(
    @Args('boardId') boardId: string,
    @Args('rate') rate: number, //
  ) {
    //boardId로 runner찾기
    //temporary로 하나로 합쳐놓음
    return this.usersService.updateRate({ boardId, rate });
  }
}
