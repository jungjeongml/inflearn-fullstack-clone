"use client";

import { CourseCategory, User } from "@/generated/openapi-client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Layers, Search } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import React from "react";
import { CATEGORY_ICONS } from "@/app/constants/category-icons";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

export default function SiteHeader({
  session,
  profile,
  categories,
}: {
  session: Session | null;
  profile?: User;
  categories: CourseCategory[];
}) {
  const pathname = usePathname();
  const isSiteHeaderNeeded = !pathname.includes("/course/");
  const isCategoryNeeded = pathname == "/" || pathname.includes("/courses");

  if (!isSiteHeaderNeeded) return null;

  const navItems = [
    {
      id: "course",
      title: "강의",
      src: "/images/course_logo.png",
      alt: "course",
    },
    {
      id: "roadmap",
      title: "로드맵",
      src: "/images/roadmap_logo.png",
      alt: "roadmap",
    },
    {
      id: "mentoring",
      title: "멘토링",
      src: "/images/mentoring_logo.png",
      alt: "mentoring",
    },
    {
      id: "community",
      title: "커뮤니티",
      src: "/images/clip_logo.avif",
      alt: "community",
    },
  ];

  return (
    <header className="relative site-header w-full">
      <div className="h-[65px] flex items-center">
        <div className="header-top w-full flex justify-between">
          <div className="logo">
            <Link href="/">
              <Image
                src="/images/inflearn_public_logo.svg"
                alt="inflearn"
                width={117}
                height={48}
              />
            </Link>
          </div>
          <div className="flex items-center">
            <nav className="flex gap-[0.625rem]">
              {navItems.map((item) => (
                <Link href="#" key={item.id}>
                  <div className="flex gap-[0.125rem] items-center px-2.5 py-1.5">
                    <div>
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={32}
                        height={32}
                      />
                    </div>
                    <div>
                      <p className="nav-item-p">{item.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
            <div>
              <form action="">
                <div className="relative flex w-full items-center">
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
          <div className="flex gap-[0.625rem] items-center">
            <Button
              asChild
              className="font-semibold border-gray-200 hover:border-[#1dc078] hover:text-[#1dc078]"
            >
              <Link href="/instructor">지식공유자</Link>
            </Button>
            {/* Avatar + Popover or 로그인 버튼 */}
            {session ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="ml-2 cursor-pointer">
                    <Avatar>
                      {profile?.image ? (
                        <img
                          src={profile.image}
                          alt="avatar"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback>
                          <span role="img" aria-label="user">
                            👤
                          </span>
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-0">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-800">
                      {profile?.name || profile?.email || "내 계정"}
                    </div>
                    {profile?.email && (
                      <div className="text-xs text-gray-500 mt-1">
                        {profile.email}
                      </div>
                    )}
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none"
                    onClick={() =>
                      (window.location.href = "/my/settings/account")
                    }
                  >
                    <div className="font-semibold text-gray-800">
                      프로필 수정
                    </div>
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none border-t border-gray-100"
                    onClick={() => signOut()}
                  >
                    <div className="font-semibold text-gray-800">로그아웃</div>
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                asChild
                variant="outline"
                className="font-semibold border-gray-200 hover:border-[#1dc078] hover:text-[#1dc078] ml-2"
              >
                <Link href="/signin">로그인</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="header-bottom bg-white px-8">
        {isCategoryNeeded && (
          <nav className="category-nav flex justify-between gap-6 py-4 overflow-x-auto scrollbar-none">
            {categories.map((category) => (
              <Link key={category.id} href={`/courses/${category.slug}`}>
                <div className="category-item flex flex-col items-center min-w-[72px] text-gray-700 hover:text-[#1dc078] cursor-pointer transition-colors">
                  {/* <Layers size={28} className="mb-1" /> */}
                  {React.createElement(
                    CATEGORY_ICONS[category.slug] || CATEGORY_ICONS["default"],
                    {
                      size: 28,
                      className: "mb-1",
                    },
                  )}
                  <span className="text-xs font-medium whitespace-nowrap">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="border-b absolute bottom-0 w-screen left-1/2 -translate-x-1/2"></div>
    </header>
  );
}
