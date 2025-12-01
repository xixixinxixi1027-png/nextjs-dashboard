// 用于初始化认证服务
import NextAuth from 'next-auth';
// 导入认证基础配置（比如权限回调、自定义登录页）
import { authConfig } from './auth.config';
// 添加【凭据提供程序】
import Credentials from 'next-auth/providers/credentials';
// 使用 zod 检查之前验证电子邮件和密码，用户是否存在于数据库中（TypeScript 类型校验工具）
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
// bcrypt 库（密码加密 / 验证工具）
import bcrypt from 'bcrypt';
// 轻量级 PostgreSQL 数据库客户端
import postgres from 'postgres';

// 数据库连接
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 根据邮箱获取用户
async function getUser(email: string): Promise<User | undefined> {
    try {
        const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
        return user[0];
    } catch (error) {
        console.error('failed to fetch user:');
        throw new Error('Failed to fetch user');
    }
}

// 初始化 NextAuth 并导出核心方法
// auth：用于在服务器组件 / API 中获取当前用户的认证状态（比如 const session = await auth()）
export const { auth, signIn, signOut } = NextAuth({
    // 展开之前导入的 authConfig 配置
    ...authConfig,
    // 在 providers 数组中添加「凭据登录提供商」，定义登录验证逻辑
    providers: [
        Credentials({
            // 登录验证的核心回调函数，NextAuth 会在用户提交登录表单时自动调用
            // credentials：用户提交的登录凭据（邮箱和密码，格式为{ email: string; password: string }
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);
                
                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null; // 用户不存在
                    // bcrypt.compare 不会解密数据库中的密码，而是将明文密码加密后与哈希值比对
                    const passwordMatch = await bcrypt.compare(password, user.password);

                    if (passwordMatch) return user; // 验证成功，返回用户对象
                }

                return null; // 验证失败（NextAuth 会提示用户登录失败）
            }
        })
    ],
});