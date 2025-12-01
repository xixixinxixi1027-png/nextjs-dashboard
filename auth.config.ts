// NextAuthConfig 是配置对象的「类型契约」，确保 authConfig 符合 NextAuth 所需的结构和类型要求
import type { NextAuthConfig } from 'next-auth';

// 导出认证配置对象，供 NextAuth 初始化时使用
export const authConfig = {
    // pages 配置：自定义认证相关页面
    pages: {
        signIn: '/login',
    },
    // 权限校验回调函数
    callbacks: {
        // NextAuth v5 新增的核心回调，用于「拦截所有请求」，判断用户是否有权访问目标页面
        // auth：包含当前用户的认证状态
        // request: { nextUrl }：当前的请求信息，nextUrl 是目标页面的 URL 对象（包含 pathname 路径、host 域名等）
        authorized({ auth, request: { nextUrl } }) {
            // 判断用户是否已登录：双重否定，把 undefined/ null 转为 false，有用户信息则转为 true
            const isLoggedIn = !!auth?.user;
            // 判断用户是否正在访问 /dashboard 相关页面（含子路由，比如 /dashboard/profile）
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            // 用户访问 /dashboard 页面
            if (isOnDashboard) {
                if(isLoggedIn) return true;
                // 未登录，拒绝访问（NextAuth 会自动跳转到 signIn 配置的 /login 页）
                return false;
            // 用户未访问 /dashboard（比如访问 /、/about 等公开页面），但已登录
            } else if (isLoggedIn) {
                // 强制重定向到 /dashboard 页面（避免已登录用户访问登录页/公开页）
                return Response.redirect(new URL('/dashboard', nextUrl))
            }
            // 用户未登录，且访问的是公开页面（非 /dashboard）→ 允许访问
            return true
        }
    },
    // 认证提供商（暂时为空）
    providers: [],
} satisfies NextAuthConfig;