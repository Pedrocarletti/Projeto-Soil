import { Role } from '../enums/role.enum';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}
