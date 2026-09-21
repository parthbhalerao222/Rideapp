import { UserService } from '../src/application/services/UserService';
import { InMemoryUserRepository } from '../src/infrastructure/repositories/InMemoryUserRepository';
import { UserNotFoundError } from '../src/shared/errors';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    userService = new UserService(userRepository);
  });

  it('should register a new user', async () => {
    const user = await userService.registerUser('John Doe', 'john@example.com', '1234567890');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.phone).toBe('1234567890');
    expect(user.id).toBeDefined();
    expect(user.id.startsWith('user_')).toBe(true);
  });

  it('should retrieve user by id', async () => {
    const registered = await userService.registerUser('Jane Doe', 'jane@example.com', '0987654321');
    const retrieved = await userService.getUserById(registered.id);
    expect(retrieved.id).toBe(registered.id);
    expect(retrieved.name).toBe('Jane Doe');
  });

  it('should throw UserNotFoundError if user does not exist', async () => {
    await expect(userService.getUserById('non_existent_id')).rejects.toThrow(UserNotFoundError);
  });

  it('should get all users', async () => {
    await userService.registerUser('User1', 'user1@example.com', '1111111111');
    await userService.registerUser('User2', 'user2@example.com', '2222222222');
    const users = await userService.getAllUsers();
    expect(users.length).toBe(2);
  });
});
