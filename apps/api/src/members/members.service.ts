import { Injectable } from '@nestjs/common';

const USER_API_URL = process.env.USER_API_URL;

interface UserApiResponse<T> {
  error: boolean;
  data: T;
  status: number;
}

export interface Member {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: string | null;
  profilePic: string | null;
  birthday: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class MembersService {
  private unwrap<T>(body: UserApiResponse<T>): T {
    if (body.error) {
      throw new Error(`User API returned error`);
    }
    return body.data;
  }

  async findAll(): Promise<Member[]> {
    const res = await fetch(`${USER_API_URL}/users`);
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    const body = (await res.json()) as UserApiResponse<Member[]>;
    return this.unwrap(body);
  }

  async findByClerkId(clerkId: string): Promise<Member | null> {
    const res = await fetch(`${USER_API_URL}/users/clerk/${clerkId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    const body = (await res.json()) as UserApiResponse<Member>;
    return this.unwrap(body);
  }

  async create(data: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<Member> {
    const res = await fetch(`${USER_API_URL}/users/clerk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    const body = (await res.json()) as UserApiResponse<Member>;
    return this.unwrap(body);
  }

  async findOrCreateByClerkId(
    clerkId: string,
    userData: { email: string; firstName: string; lastName: string },
  ): Promise<Member> {
    const existing = await this.findByClerkId(clerkId);
    if (existing) return existing;
    return this.create({ clerkId, ...userData });
  }

  async update(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Member> {
    const res = await fetch(`${USER_API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    const body = (await res.json()) as UserApiResponse<Member>;
    return this.unwrap(body);
  }
}
