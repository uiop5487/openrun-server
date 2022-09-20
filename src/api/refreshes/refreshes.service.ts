import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Board, BOARD_STATUS_ENUM } from '../boards/entities/board.entity';
import { PaymentHistory } from '../paymentHistories/entities/paymentHistory.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RefreshesService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PaymentHistory)
    private readonly paymentHistory: Repository<PaymentHistory>,

    //ElasticSearch
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  @Cron('* * * * *')
  async refreshBoard() {
    //마감기간이 넘어간 board가 있는지 확인
    const today = new Date();
    const newBoard = await this.boardRepository.find({
      where: {
        status: BOARD_STATUS_ENUM.RECRUITING, //
        dueDate: LessThan(today),
      },
      relations: ['user'],
    });
    if (newBoard.length === 0) {
      return;
    }

    for (let i = 0; i < newBoard.length; i++) {
      this.boardRepository.update(
        { id: newBoard[i].id },
        { status: BOARD_STATUS_ENUM.ENDED },
      );
      // status 바꾸기
      await this.paymentHistory.save({
        board: newBoard[i],
        user: newBoard[i].user,
        price: newBoard[i].price,
        title: newBoard[i].title,
        status: 'refund',
      });

      //ElasticSearch에서 삭제
      await this.elasticsearchService.deleteByQuery({
        index: 'board',
        query: {
          match: {
            _id: newBoard[i].id,
          },
        },
      });

      // payment 포인트 업데이트
      this.userRepository.update(
        { email: newBoard[i].user.email },
        { point: newBoard[i].user.point + newBoard[i].price },
      );
      // user 포인트 업데이트 시켜주기
    }
  }
}
