import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface CardKey {
  id: string;
  tenant_url: string;
  access_token: string;
  email: string;
  balance_url?: string;
  expiry_date: string;
  query_params: string;
  secure_token: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

class NeonDatabaseManager {
  private sql: any;

  constructor() {
    // 尝试多种可能的环境变量名称
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.DATABASE_DATABASE_URL || 
                       process.env.DATABASE_POSTGRES_URL;
    if (!databaseUrl) {
      throw new Error('Database URL environment variable is not set');
    }
    this.sql = neon(databaseUrl);
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      // 创建卡密表
      await this.sql`
        CREATE TABLE IF NOT EXISTS card_keys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_url TEXT NOT NULL,
          access_token TEXT NOT NULL,
          email TEXT NOT NULL,
          balance_url TEXT,
          expiry_date TEXT NOT NULL,
          query_params TEXT NOT NULL,
          secure_token TEXT UNIQUE NOT NULL,
          is_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used_at TIMESTAMP
        )
      `;

      // 创建管理员表
      await this.sql`
        CREATE TABLE IF NOT EXISTS admins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 创建索引以提高查询性能
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_card_keys_secure_token ON card_keys(secure_token)
      `;
      
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_card_keys_is_used ON card_keys(is_used)
      `;

      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)
      `;

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // 生成安全令牌
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 添加卡密
  async addCardKey(cardData: Omit<CardKey, 'id' | 'secure_token' | 'is_used' | 'created_at' | 'used_at'>): Promise<string> {
    const secure_token = this.generateSecureToken();
    
    await this.sql`
      INSERT INTO card_keys (
        tenant_url, access_token, email, balance_url, 
        expiry_date, query_params, secure_token
      ) VALUES (
        ${cardData.tenant_url}, ${cardData.access_token}, ${cardData.email}, 
        ${cardData.balance_url || null}, ${cardData.expiry_date}, 
        ${cardData.query_params}, ${secure_token}
      )
    `;

    return secure_token;
  }

  // 批量导入卡密
  async batchAddCardKeys(cardDataArray: Array<Omit<CardKey, 'id' | 'secure_token' | 'is_used' | 'created_at' | 'used_at'>>): Promise<string[]> {
    const tokens: string[] = [];
    
    for (const cardData of cardDataArray) {
      const token = await this.addCardKey(cardData);
      tokens.push(token);
    }
    
    return tokens;
  }

  // 通过安全令牌获取卡密
  async getCardKeyByToken(secure_token: string): Promise<CardKey | null> {
    const result = await this.sql`
      SELECT * FROM card_keys WHERE secure_token = ${secure_token}
    `;
    
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      id: row.id,
      tenant_url: row.tenant_url,
      access_token: row.access_token,
      email: row.email,
      balance_url: row.balance_url,
      expiry_date: row.expiry_date,
      query_params: row.query_params,
      secure_token: row.secure_token,
      is_used: row.is_used,
      created_at: row.created_at,
      used_at: row.used_at
    };
  }

  // 标记卡密为已使用
  async markCardKeyAsUsed(secure_token: string): Promise<boolean> {
    const result = await this.sql`
      UPDATE card_keys 
      SET is_used = TRUE, used_at = CURRENT_TIMESTAMP 
      WHERE secure_token = ${secure_token} AND is_used = FALSE
      RETURNING id
    `;
    
    return result.length > 0;
  }

  // 恢复卡密为未使用状态
  async restoreCardKey(secure_token: string): Promise<boolean> {
    const result = await this.sql`
      UPDATE card_keys 
      SET is_used = FALSE, used_at = NULL 
      WHERE secure_token = ${secure_token} AND is_used = TRUE
      RETURNING id
    `;
    
    return result.length > 0;
  }

  // 获取所有卡密（管理端）
  async getAllCardKeys(): Promise<CardKey[]> {
    const result = await this.sql`
      SELECT * FROM card_keys 
      ORDER BY created_at DESC
    `;
    
    return result.map((row: any) => ({
      id: row.id,
      tenant_url: row.tenant_url,
      access_token: row.access_token,
      email: row.email,
      balance_url: row.balance_url,
      expiry_date: row.expiry_date,
      query_params: row.query_params,
      secure_token: row.secure_token,
      is_used: row.is_used,
      created_at: row.created_at,
      used_at: row.used_at
    }));
  }

  // 删除卡密
  async deleteCardKey(id: string): Promise<boolean> {
    const result = await this.sql`
      DELETE FROM card_keys WHERE id = ${id}
      RETURNING id
    `;
    
    return result.length > 0;
  }

  // 获取统计信息
  async getStats() {
    const totalResult = await this.sql`
      SELECT COUNT(*) as count FROM card_keys
    `;
    
    const usedResult = await this.sql`
      SELECT COUNT(*) as count FROM card_keys WHERE is_used = TRUE
    `;
    
    const total = parseInt(totalResult[0].count);
    const used = parseInt(usedResult[0].count);
    
    return {
      total,
      used,
      unused: total - used
    };
  }

  // 添加管理员
  async addAdmin(username: string, passwordHash: string): Promise<string> {
    const result = await this.sql`
      INSERT INTO admins (username, password_hash) 
      VALUES (${username}, ${passwordHash})
      RETURNING id
    `;
    
    return result[0].id;
  }

  // 通过用户名获取管理员
  async getAdminByUsername(username: string): Promise<Admin | null> {
    const result = await this.sql`
      SELECT * FROM admins WHERE username = ${username}
    `;
    
    if (result.length === 0) return null;
    
    const row = result[0];
    return {
      id: row.id,
      username: row.username,
      password_hash: row.password_hash,
      created_at: row.created_at
    };
  }

  // 更新管理员密码
  async updateAdminPassword(username: string, passwordHash: string): Promise<boolean> {
    const result = await this.sql`
      UPDATE admins 
      SET password_hash = ${passwordHash} 
      WHERE username = ${username}
      RETURNING id
    `;
    
    return result.length > 0;
  }

  // 从JSON数据迁移到PostgreSQL
  async migrateFromJson(jsonData: { cardKeys: any[], admins: any[] }): Promise<void> {
    try {
      // 迁移卡密数据
      for (const cardKey of jsonData.cardKeys) {
        await this.sql`
          INSERT INTO card_keys (
            id, tenant_url, access_token, email, balance_url, 
            expiry_date, query_params, secure_token, is_used, 
            created_at, used_at
          ) VALUES (
            ${cardKey.id}, ${cardKey.tenant_url}, ${cardKey.access_token}, 
            ${cardKey.email}, ${cardKey.balance_url || null}, 
            ${cardKey.expiry_date}, ${cardKey.query_params}, 
            ${cardKey.secure_token}, ${cardKey.is_used}, 
            ${cardKey.created_at}, ${cardKey.used_at || null}
          ) ON CONFLICT (secure_token) DO NOTHING
        `;
      }

      // 迁移管理员数据
      for (const admin of jsonData.admins) {
        await this.sql`
          INSERT INTO admins (id, username, password_hash, created_at) 
          VALUES (${admin.id}, ${admin.username}, ${admin.password_hash}, ${admin.created_at})
          ON CONFLICT (username) DO NOTHING
        `;
      }

      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  close() {
    // Neon serverless 连接不需要手动关闭
  }
}

// 单例模式
let dbInstance: NeonDatabaseManager | null = null;

export function getDatabase(): NeonDatabaseManager {
  if (!dbInstance) {
    dbInstance = new NeonDatabaseManager();
  }
  return dbInstance;
}
