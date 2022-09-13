import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Payment, PAYMENT_STATUS_ENUM } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly connection: DataSource,
  ) {}

  async findPayment({ impUid }) {
    const result = await this.paymentRepository.findOne({
      where: { impUid: impUid },
      order: { id: 'DESC' },
      relations: ['user'],
    });

    return result;
  }

  async findPointCharge({ id, page }) {
    const result = await this.paymentRepository.find({
      where: { user: { id: id } },
      order: { createdAt: 'DESC' },
      relations: ['user'],
      take: 10,
      skip: page ? (page - 1) * 10 : 0,
    });

    return result;
  }

  async findTotalAmount() {
    const result = await this.paymentRepository.find({
      order: { createdAt: 'ASC' },
    });
    const obj = {};
    result.forEach((el) => {
      const id = JSON.stringify(el.createdAt).slice(1, 11);
      if (!obj[id]) {
        obj[id] = [
          {
            id: id,
            amount: el.amount,
            count: 1,
          },
        ];
      } else {
        obj[id][0].amount = obj[id][0].amount + el.amount;
        obj[id][0].count = obj[id][0].count + 1;
      }
    });

    const arr = Object.values(obj).map((el) => el[0]);

    return arr;
  }

  async create({ impUid, amount, user: _user }) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: _user.id },
        relations: {
          bankAccount: true,
        },
        lock: { mode: 'pessimistic_write' },
      });

      const payment = this.paymentRepository.create({
        impUid,
        amount: amount,
        user,
        status: PAYMENT_STATUS_ENUM.PAYMENT,
      });

      await queryRunner.manager.save(payment);

      const updateUser = this.userRepository.create({
        ...user,
        point: user.point + amount,
      });

      await queryRunner.manager.save(updateUser);

      await queryRunner.commitTransaction();

      return payment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async cancel({ impUid, user, amount }) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const findUser = await queryRunner.manager.findOne(User, {
        where: { id: user.id },
        lock: { mode: 'pessimistic_write' },
      });

      const updateUser = this.userRepository.create({
        ...findUser,
        point: findUser.point - amount,
      });

      await queryRunner.manager.save(updateUser);

      const cancelPayment = this.paymentRepository.create({
        amount: -amount,
        impUid,
        user: findUser,
        status: PAYMENT_STATUS_ENUM.CANCEL,
      });

      await queryRunner.manager.save(cancelPayment);

      await queryRunner.commitTransaction();

      return cancelPayment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
