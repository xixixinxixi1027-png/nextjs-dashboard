'use server';

// 类型验证库(以 TypeScript 为先的验证库)
import { z } from "zod";
// 手动触发路径缓存重新验证的核心 API，主要用于在数据发生变化后
// 强制更新指定路径的缓存内容，确保用户看到最新数据
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
// 创建数据库客户端实例
import postgres from 'postgres';

// 调用 postgres() 函数创建客户端实例，并将其赋值给变量 sql（后续通过 sql 执行 SQL 语句）
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// z.coerce.string() 表示强制转换为字符串
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'CustomerId is required.'
    }),
    amount: z.coerce.number().gt(0, {
        message: 'Amount must be greater than 0.'
    }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Status is required.'
    }),
    date: z.string(),
})

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    }
    message?: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true });

// 创建发票
export async function createInvoice(prevState: State, formData: FormData) {
    // console.log('formData -->', formData);
    // // Validate form using Zod
    const validateFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: 'Validation Error: Please check the form fields.'
        }
    }

    const { customerId, amount, status } = validateFields.data;
    const amountInCents = amount * 100;
    // // 获取当前日期，格式为 YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        console.error(error)
        return {
            message: 'Database Error: Failed to Create Invoice.'
        }
    }

    // 强制刷新指定路径的缓存 ** 的关键操作，确保该路径展示的数据是最新的
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// 更新发票
export async function updateInvoice(
    id: string,
    formData: FormData,
    prevState: State,
) {
    const validateFields = UpdateInvoice.safeParse({
        customId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: 'Validation Error: Please check the form fields.'
        }
    }

    const { customerId, amount, status } = validateFields.data;
    const amountInCents = amount * 100;
    
    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        console.log(error)
        return {
            message: 'Database Error: Failed to Update Invoice.'
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

// 删除发票
export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}