import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Runner } from './entities/runner.entity';

@Injectable()
export class RunnersService {
  constructor(
    @InjectRepository(Runner)
    private readonly runnerRepository: Repository<Runner>, //
  ) {}

  create({ user, board }) {
    return this.runnerRepository.save({
      isChecked: false,
      user,
      board,
    });
  }

  async findAllByBoard({ boardId }) {
    const result = await this.runnerRepository.find({
      where: { board: { id: boardId } },
      relations: {
        user: true,
      },
    });
    return result.map((el) => el.user);
  }
}
