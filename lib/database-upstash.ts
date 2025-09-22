import { Redis } from '@upstash/redis';
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

interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

class UpstashDatabaseManager {
  private redis: Redis;
  private readonly CARDKEYS_KEY = 'cardkeys';
  private readonly ADMINS_KEY = 'admins';

  constructor() {
    // 从环境变量初始化 Upstash Redis
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  // 生成安全令牌
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 添加卡密
  async addCardKey(cardData: Omit<CardKey, 'id' | 'secure_token' | 'is_used' | 'created_at' | 'used_at'>): Promise<string> {
    const id = uuidv4();
    const secure_token = this.generateSecureToken();
    const created_at = new Date().toISOString();

    const newCardKey: CardKey = {
      id,
      tenant_url: cardData.tenant_url,
      access_token: cardData.access_token,
      email: cardData.email,
      balance_url: cardData.balance_url,
      expiry_date: cardData.expiry_date,
      query_params: cardData.query_params,
      secure_token,
      is_used: false,
      created_at,
      used_at: undefined
    };

    // 获取现有卡密列表
    const existingCards = await this.getAllCardKeys();
    existingCards.push(newCardKey);
    
    // 保存到 Redis
    await this.redis.set(this.CARDKEYS_KEY, JSON.stringify(existingCards));

    return secure_token;
  }

  // 批量导入卡密
  async batchAddCardKeys(cardDataArray: Array<Omit<CardKey, 'id' | 'secure_token' | 'is_used' | 'created_at' | 'used_at'>>): Promise<string[]> {
    const tokens: string[] = [];
    const existingCards = await this.getAllCardKeys();
    
    for (const cardData of cardDataArray) {
      const id = uuidv4();
      const secure_token = this.generateSecureToken();
      const created_at = new Date().toISOString();

      const newCardKey: CardKey = {
        id,
        ...cardData,
        secure_token,
        is_used: false,
        created_at,
        used_at: undefined
      };

      existingCards.push(newCardKey);
      tokens.push(secure_token);
    }
    
    // 批量保存到 Redis
    await this.redis.set(this.CARDKEYS_KEY, JSON.stringify(existingCards));
    return tokens;
  }

  // 通过安全令牌获取卡密
  async getCardKeyByToken(secure_token: string): Promise<CardKey | null> {
    const cards = await this.getAllCardKeys();
    return cards.find(card => card.secure_token === secure_token) || null;
  }

  // 标记卡密为已使用
  async markCardKeyAsUsed(secure_token: string): Promise<boolean> {
    const cards = await this.getAllCardKeys();
    const cardKey = cards.find(card => card.secure_token === secure_token && !card.is_used);
    
    if (cardKey) {
      cardKey.is_used = true;
      cardKey.used_at = new Date().toISOString();
      await this.redis.set(this.CARDKEYS_KEY, JSON.stringify(cards));
      return true;
    }
    
    return false;
  }

  // 恢复卡密为未使用状态
  async restoreCardKey(secure_token: string): Promise<boolean> {
    const cards = await this.getAllCardKeys();
    const cardKey = cards.find(card => card.secure_token === secure_token && card.is_used);
    
    if (cardKey) {
      cardKey.is_used = false;
      cardKey.used_at = undefined;
      await this.redis.set(this.CARDKEYS_KEY, JSON.stringify(cards));
      return true;
    }
    
    return false;
  }

  // 获取所有卡密（管理端）
  async getAllCardKeys(): Promise<CardKey[]> {
    try {
      const cardsData = await this.redis.get(this.CARDKEYS_KEY);
      if (!cardsData) return [];
      
      const cards = typeof cardsData === 'string' ? JSON.parse(cardsData) : cardsData;
      return [...cards].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error getting cards from Upstash:', error);
      return [];
    }
  }

  // 删除卡密
  async deleteCardKey(id: string): Promise<boolean> {
    const cards = await this.getAllCardKeys();
    const index = cards.findIndex(card => card.id === id);
    
    if (index !== -1) {
      cards.splice(index, 1);
      await this.redis.set(this.CARDKEYS_KEY, JSON.stringify(cards));
      return true;
    }
    
    return false;
  }

  // 获取统计信息
  async getStats() {
    const cards = await this.getAllCardKeys();
    const total = cards.length;
    const used = cards.filter(card => card.is_used).length;
    
    return {
      total,
      used,
      unused: total - used
    };
  }

  // 添加管理员
  async addAdmin(username: string, passwordHash: string): Promise<string> {
    const id = uuidv4();
    const created_at = new Date().toISOString();
    
    const newAdmin: Admin = {
      id,
      username,
      password_hash: passwordHash,
      created_at
    };
    
    const existingAdmins = await this.getAllAdmins();
    existingAdmins.push(newAdmin);
    await this.redis.set(this.ADMINS_KEY, JSON.stringify(existingAdmins));
    
    return id;
  }

  // 通过用户名获取管理员
  async getAdminByUsername(username: string): Promise<Admin | null> {
    const admins = await this.getAllAdmins();
    return admins.find(admin => admin.username === username) || null;
  }

  // 获取所有管理员
  async getAllAdmins(): Promise<Admin[]> {
    try {
      const adminsData = await this.redis.get(this.ADMINS_KEY);
      if (!adminsData) return [];
      
      const result = typeof adminsData === 'string' ? JSON.parse(adminsData) : adminsData;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error getting admins from Upstash:', error);
      return [];
    }
  }

  // 更新管理员密码
  async updateAdminPassword(username: string, passwordHash: string): Promise<boolean> {
    const admins = await this.getAllAdmins();
    const admin = admins.find(admin => admin.username === username);
    
    if (admin) {
      admin.password_hash = passwordHash;
      await this.redis.set(this.ADMINS_KEY, JSON.stringify(admins));
      return true;
    }
    
    return false;
  }

  // 数据导出
  async exportToJSON(): Promise<{ cardKeys: CardKey[], admins: Admin[] }> {
    const cardKeys = await this.getAllCardKeys();
    const admins = await this.getAllAdmins();
    
    return {
      cardKeys,
      admins
    };
  }

  close() {
    // Upstash Redis 连接不需要手动关闭
  }
}

// 单例模式
let upstashDbInstance: UpstashDatabaseManager | null = null;

export function getUpstashDatabase(): UpstashDatabaseManager {
  if (!upstashDbInstance) {
    upstashDbInstance = new UpstashDatabaseManager();
  }
  return upstashDbInstance;
}
