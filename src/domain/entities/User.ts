export class User {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string
  ) {}

  static create(id: string, name: string, email: string, phone: string): User {
    if (!name || !email || !phone) {
      throw new Error('User must have name, email, and phone');
    }
    return new User(id, name, email, phone);
  }
}
