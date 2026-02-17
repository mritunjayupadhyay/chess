import { Injectable } from '@nestjs/common';

const USER_API_URL = process.env.USER_API_URL;

@Injectable()
export class MembersService {
  async findAll() {
    const res = await fetch(`${USER_API_URL}/users`);
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    return res.json();
  }

  async findByClerkId(clerkId: string) {
    const res = await fetch(`${USER_API_URL}/users/clerk/${clerkId}`);
    const data = await res.json();
    console.log('findByClerkId', clerkId, data, USER_API_URL);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    return data;
  }

  async create(data: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const res = await fetch(`${USER_API_URL}/users/clerk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    return res.json();
  }

  async findOrCreateByClerkId(
    clerkId: string,
    userData: { email: string; firstName: string; lastName: string },
  ) {
    const existing = await this.findByClerkId(clerkId);
    if (existing) return existing;
    return this.create({ clerkId, ...userData });
  }

  async update(
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const res = await fetch(`${USER_API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`User API error: ${res.status}`);
    return res.json();
  }
}
