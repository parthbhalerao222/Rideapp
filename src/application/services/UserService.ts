import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { UserNotFoundError } from '../../shared/errors';
import { IdGenerator } from '../../shared/utils/IdGenerator';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async registerUser(name: string, email: string, phone: string): Promise<User> {
    const id = IdGenerator.generateUserId();
    const user = User.create(id, name, email, phone);
    await this.userRepository.save(user);
    return user;
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
