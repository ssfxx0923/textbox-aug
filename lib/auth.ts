import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getDatabase } from './database';

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET as string) || 'your-secret-key-change-this-in-production'
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createJWT(payload: { userId: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function authenticateAdmin(username: string, password: string) {
  const db = getDatabase();
  const admin = db.getAdminByUsername(username) as any;
  
  if (!admin) {
    return null;
  }
  
  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) {
    return null;
  }
  
  const token = await createJWT({ userId: admin.id, username: admin.username });
  return { token, admin: { id: admin.id, username: admin.username } };
}

// 初始化默认管理员账户
export async function initDefaultAdmin() {
  const db = getDatabase();
  const existingAdmin = db.getAdminByUsername('admin');
  
  if (!existingAdmin) {
    const passwordHash = await hashPassword('admin123');
    db.addAdmin('admin', passwordHash);
    console.log('Default admin created: username=admin, password=admin123');
  }
}
