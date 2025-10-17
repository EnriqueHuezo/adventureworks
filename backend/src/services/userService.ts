import bcrypt from 'bcryptjs';
import { userRepository, UserFilters } from '../repositories/userRepository';

export const userService = {
  async getAll(filters: UserFilters) {
    return userRepository.findAll(filters);
  },

  async getById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  },

  async create(data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    branchId?: number;
    roleIds: number[];
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      email: data.email,
      username: data.username,
      password: hashedPassword,
      fullName: data.fullName,
      branch: data.branchId ? { connect: { id: data.branchId } } : undefined,
      roles: {
        create: data.roleIds.map(roleId => ({
          role: { connect: { id: roleId } }
        }))
      }
    });

    return user;
  },

  async update(id: number, data: {
    email?: string;
    username?: string;
    password?: string;
    fullName?: string;
    branchId?: number | null;
  }) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.branchId !== undefined) {
      if (data.branchId === null) {
        updateData.branch = { disconnect: true };
      } else {
        updateData.branch = { connect: { id: data.branchId } };
      }
      delete updateData.branchId;
    }

    return userRepository.update(id, updateData);
  },

  async delete(id: number) {
    return userRepository.delete(id);
  },

  async updateRoles(id: number, roleIds: number[]) {
    await userRepository.updateRoles(id, roleIds);
    return userRepository.findById(id);
  },

  async updateStatus(id: number, isActive: boolean) {
    return userRepository.updateStatus(id, isActive);
  }
};

