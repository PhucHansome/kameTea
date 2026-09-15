import { Request } from 'express';
import { getServerSupabaseClient } from '../config/supabase';

export interface DbUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'CASHIER' | 'SERVER' | 'KITCHEN';
  salary_type: 'HOURLY' | 'MONTHLY' | 'COMBINED';
  base_salary: number;
  hourly_rate: number;
  status: 'ACTIVE' | 'OFF' | 'RESIGNED';
  joined_date: string;
  avatar?: string;
}

export class AuthRepository {
  public static async findUserByUsernameOrPhone(username: string, req?: Request): Promise<DbUser | null> {
    try {
      const supabase = getServerSupabaseClient(req);
      if (!supabase) return null;

      const cleanUser = username.trim().toLowerCase();
      const { data: userList, error } = await supabase
        .from('pos_users')
        .select('*')
        .or(`username.ilike.${cleanUser},phone.eq.${cleanUser},id.eq.${cleanUser}`);

      if (!error && userList && userList.length > 0) {
        return userList[0] as DbUser;
      }
    } catch (err: any) {
      console.warn('[AuthRepository] Supabase user query error:', err?.message);
    }
    return null;
  }
}
