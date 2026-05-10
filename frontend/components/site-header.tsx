'use client'


import { CourseCategory } from '@/generated/openapi-client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Layers, Search } from 'lucide-react';
export default function SiteHeader({categories}: {categories: CourseCategory[]}){
  const pathname = usePathname()
  const isSiteHeaderNeeded = !pathname.includes("/course/")
  const isCategoryNeeded = pathname == "/" || pathname.includes("/courses")

  if(!isSiteHeaderNeeded) return null

  const navItems = [
    {id: 'course', title: "강의", src:"/images/course_logo.png", alt:'course'},
    {id: 'roadmap', title: "로드맵", src:"/images/roadmap_logo.png", alt:'roadmap'},
    {id: 'mentoring', title: "멘토링", src:"/images/mentoring_logo.png", alt:'mentoring'},
    {id: 'community', title: "커뮤니티", src:"/images/clip_logo.avif", alt:'community'}
  ]

  return (
    <header className='site-header w-full'>
      <div className='layout-shell h-[65px] flex items-center'>
        <div className='header-top w-full flex justify-between'>
          <div className='logo'>
            <Link href="/">
              <Image
                src="/images/inflearn_public_logo.svg"
                alt='inflearn'
                width={117}
                height={48}
              />
            </Link>
          </div>
          <div className='flex items-center'>
            <nav className='flex gap-[0.625rem]'>
              {navItems.map((item) => (
                <Link href="#" key={item.id}>
                  <div className='flex gap-[0.125rem] items-center px-2.5 py-1.5'>
                    <div><Image  src={item.src} alt={item.alt} width={32} height={32} /></div>
                    <div><p className='nav-item-p'>{item.title}</p></div>
                  </div>
                </Link>
              ))}
            </nav>
             <div>
              <form action="">
                <div className="relative flex w-full max-w-xl items-center">
                  <Input
                    type="text"
                    placeholder="나의 진짜 성장을 도와줄 실무 강의를 찾아보세요"
                    className="w-full bg-gray-50 border-gray-200 focus-visible:ring-[#1dc078] pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1 text-gray-400 hover:text-[#1dc078] transition-colors"
                    tabIndex={-1}
                  >
                    <Search size={20} />
                  </button>
                </div>
              </form>
             </div>
          </div>
          <div className='flex gap-[0.625rem] items-center'>
            <Link href='/instructor'>
              <Button className='font-semibold border-gray-200 hover:border-[#1dc078] hover:text-[#1dc078]'>
                지식공유자
              </Button>
            </Link>
            <Avatar>
              <AvatarImage src="/images/default_profile.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
      <div className='header-bottom bg-white px-8'>
        {isCategoryNeeded && (
          <nav className='category-nav flex gap-6 py-4 overflow-x-auto scrollbar-none'>
            {categories.map((category) => (
              <Link key={category.id} href={`/courses/${category.slug}`}>
                <div className='category-item flex flex-col items-center min-w-[72px] text-gray-700 hover:text-[#1dc078] cursor-pointer transition-colors'>
                  <Layers size={28} className='mb-1' />
                  <span className='text-xs font-medium whitespace-nowrap'>
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
