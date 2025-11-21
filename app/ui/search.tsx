'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  // URLSearchParams 是一个 Web API，它提供了一些用于操作 URL 查询参数的实用方法
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 处理搜索参数变化并更新 URL 的函数
  const handleChange = useDebouncedCallback((term: string) => {
    console.log('Search term:', term);
    // 创建一个新的 URLSearchParams 实例，以便我们可以修改查询参数
    const params = new URLSearchParams(searchParams.toString())
    // 每次搜索时 重置页码到 1
    params.set('page', '1')
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    // 使用用户的搜索数据，更新 URL
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleChange(e.target.value)
        }}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
