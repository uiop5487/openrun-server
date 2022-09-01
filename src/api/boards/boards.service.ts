import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '../images/entities/image.entity';
import { User } from '../users/entities/user.entity';
import { Board } from './entities/board.entity';
import { Location } from '../locations/entities/location.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Category } from '../categories/entities/category.entity';
import { UsersService } from '../users/users.service';
// import { Tag } from '../tags/entities/tag.entity';
// import { Category } from '../categories/entities/category.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly userService: UsersService,
  ) {}

  //게시물 등록
  async create({ createBoardInput, email }) {
    const { tag, category, image, location } = createBoardInput;

    const resultUser = await this.userService.findOne({
      email,
    });

    console.log(resultUser);

    const resultLocation = await this.locationRepository.save({
      ...location,
    });

    console.log(resultLocation);

    const resultTag = await this.tagRepository.save({
      name: tag,
    });

    console.log(resultTag);
    const resultCategory = await this.categoryRepository.save({
      name: category,
    });

    console.log(resultCategory);

    const result = await this.boardRepository.save({
      ...createBoardInput,
      location: resultLocation,
      tag: resultTag,
      category: resultCategory,
      user: resultUser,
    });

    const arr = [];
    for (let i = 0; i < image.length; i++) {
      const temp = await this.imageRepository.save({
        url: image[i],
        board: result.id,
      });

      arr.push(temp);
    }
    console.log(result);
    return {
      ...result,
      image: arr,
      location: resultLocation,
      tag: resultTag,
      category: resultCategory,
      user: resultUser,
    };
  }
  //상세페이지
  async findOne({ boardId }) {
    // const result = await this.imageRepository.find({
    //   where: { board: { id: boardId } },
    // });
    // const arr = [];
    // for (let i = 0; i < result.length; i++) {
    //   arr.push(result[i].url);
    // }
    // console.log(arr);
    const resultBoard = await this.boardRepository.findOne({
      where: { id: boardId },
      // relations: ['tag', 'category', 'user', 'location', 'image'],
      relations: {
        tag: true,
        category: true,
        user: true,
        location: true,
        image: true,
      },
    });
    return resultBoard;
    // return {
    //   ...resultBoard,
    //   image: arr,
    // };
  }

  async findAll() {
    return await this.boardRepository.find({
      //   relations: [],
    });
  }
}
