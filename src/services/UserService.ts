import { User } from "@/models/User";

class UserService {
  private users: User[] = [];

  public getAllUsers(): User[] {
    return this.users;
  }

  public addUser(user: User): void {
    this.users.push(user);
  }
}

export default new UserService();
