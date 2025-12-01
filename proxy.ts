import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

// 代理来完成这项任务的优势在于，受保护的路由甚至不会开始渲染
// 直到代理验证身份验证为止，从而提高了应用程序的安全性和性能
export const config = {
    // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};