export class IdGenerator {
  static generate(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateUserId(): string {
    return this.generate('user');
  }

  static generateDriverId(): string {
    return this.generate('driver');
  }

  static generateRideId(): string {
    return this.generate('ride');
  }
}
