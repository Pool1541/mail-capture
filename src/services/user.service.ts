import { User } from "@/models/User";

export class UserService {
  private users: User[] = [];

  public getUserInfo(userId: string): string | undefined {
    // Solicitud para obtener la información del usuario por su ID.
    return userId;
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public addUser(user: User): void {
    this.users.push(user);
  }
}
