import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import { getDatabase as getNeonDatabase } from './database-neon';

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

class DatabaseManager {
  private db: any;
  private data: { cardKeys: CardKey[], admins: any[] } = { cardKeys: [], admins: [] };
  private dataPath: string;

  constructor() {
    this.dataPath = process.env.NODE_ENV === 'production' 
      ? '/tmp/cardkeys.json' 
      : './cardkeys.json';
    
    this.loadData();
    this.initDatabase();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const rawData = fs.readFileSync(this.dataPath, 'utf8');
        this.data = JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.data = { cardKeys: [], admins: [] };
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private initDatabase() {
    // 确保数据结构存在
    if (!this.data.cardKeys) this.data.cardKeys = [];
    if (!this.data.admins) this.data.admins = [];
    this.saveData();
  }

  // 生成安全令牌
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 添加卡密
  addCardKey(cardData: Omit<CardKey, 'id' | 'secure_token' | 'is_used' | 'created_at' | 'used_at'>): string {
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

    this.data.cardKeys.push(newCardKey);
    this.saveData();

    return secure_token;
  }

  // 批量导入卡密
  batchAddCardKeys(cardDataArray: Array<Omit<CardKey, 'id' | 'secure_token' | 'is_used' | 'created_at' | 'used_at'>>): string[] {
    const tokens: string[] = [];
    
    for (const cardData of cardDataArray) {
      const token = this.addCardKey(cardData);
      tokens.push(token);
    }
    
    return tokens;
  }

  // 通过安全令牌获取卡密
  getCardKeyByToken(secure_token: string): CardKey | null {
    return this.data.cardKeys.find(card => card.secure_token === secure_token) || null;
  }

  // 标记卡密为已使用
  markCardKeyAsUsed(secure_token: string): boolean {
    const cardKey = this.data.cardKeys.find(card => card.secure_token === secure_token && !card.is_used);
    
    if (cardKey) {
      cardKey.is_used = true;
      cardKey.used_at = new Date().toISOString();
      this.saveData();
      return true;
    }
    
    return false;
  }

  // 恢复卡密为未使用状态
  restoreCardKey(secure_token: string): boolean {
    const cardKey = this.data.cardKeys.find(card => card.secure_token === secure_token && card.is_used);
    
    if (cardKey) {
      cardKey.is_used = false;
      cardKey.used_at = undefined;
      this.saveData();
      return true;
    }
    
    return false;
  }

  // 获取所有卡密（管理端）
  getAllCardKeys(): CardKey[] {
    return [...this.data.cardKeys].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // 删除卡密
  deleteCardKey(id: string): boolean {
    const index = this.data.cardKeys.findIndex(card => card.id === id);
    
    if (index !== -1) {
      this.data.cardKeys.splice(index, 1);
      this.saveData();
      return true;
    }
    
    return false;
  }

  // 获取统计信息
  getStats() {
    const total = this.data.cardKeys.length;
    const used = this.data.cardKeys.filter(card => card.is_used).length;
    
    return {
      total,
      used,
      unused: total - used
    };
  }

  // 添加管理员
  addAdmin(username: string, passwordHash: string): string {
    const id = uuidv4();
    const created_at = new Date().toISOString();
    
    const newAdmin = {
      id,
      username,
      password_hash: passwordHash,
      created_at
    };
    
    this.data.admins.push(newAdmin);
    this.saveData();
    
    return id;
  }

  // 通过用户名获取管理员
  getAdminByUsername(username: string) {
    return this.data.admins.find(admin => admin.username === username);
  }

  // 更新管理员密码
  updateAdminPassword(username: string, passwordHash: string): boolean {
    const admin = this.data.admins.find(admin => admin.username === username);
    
    if (admin) {
      admin.password_hash = passwordHash;
      this.saveData();
      return true;
    }
    
    return false;
  }

  close() {
    // JSON文件存储不需要关闭连接
  }
}

// 单例模式
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  // 如果有 DATABASE_URL 环境变量，使用 Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    return getNeonDatabase() as any;
  }
  
  // 否则使用 JSON 文件存储
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}
