import { Request, Response } from 'express';
import { UserService } from '../../application/services/UserService';
import { UserResponse } from '../../application/dtos';

export class UserController {
  constructor(private userService: UserService) {}

  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone } = req.body;
      if (!name || !email || !phone) {
        res.status(400).json({ error: 'name, email, and phone are required' });
        return;
      }
      const user = await this.userService.registerUser(name, email, phone);
      const response: UserResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      };
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const user = await this.userService.getUserById(userId);
      const response: UserResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      };
      res.status(200).json(response);
    } catch (error) {
      const statusCode = error instanceof Error && error.constructor.name === 'UserNotFoundError' ? 404 : 500;
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }

  }

  async listUsers(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAllUsers();
    res.status(200).json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      }))
    );
  }
}
