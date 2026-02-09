import { Injectable } from "@nestjs/common";

// ✅ Using SHARED types
import { IUser, ICreateUserRequest } from "@myproject/shared";

@Injectable()
export class UsersService {
  private users: IUser[] = [];

  create(data: ICreateUserRequest): IUser {
    const newUser: IUser = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    return newUser;
  }
}
