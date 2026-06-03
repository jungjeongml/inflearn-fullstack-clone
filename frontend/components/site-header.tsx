"use client";

import { CourseCategory, User } from "@/generated/openapi-client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ShoppingCart } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import React, { useEffect, useState } from "react";
import { CATEGORY_ICONS } from "@/app/constants/category-icons";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";

const HEADER_COLLAPSE_THRESHOLD = 96;
const HEADER_EXPAND_THRESHOLD = 4;

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
  const isSiteHeaderNeeded =
    !pathname.match(/^\/course\/[0-9a-f-]+(\/edit|\/edit\/.*)$/) &&
    !pathname.match(/^\/courses\/lecture/);
  const isCategoryNeeded = pathname == "/" || pathname.includes("/courses");
  const [search, setSearch] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const cartItemsQuery = useQuery({
    queryFn: () => api.getCartItems(),
    queryKey: ["cart-items"],
  });
  const cartItemCount = cartItemsQuery.data?.data?.totalCount ?? 0;

  useEffect(() => {
    if (!isSiteHeaderNeeded) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      setIsScrolled((current) => {
        if (current) return scrollY > HEADER_EXPAND_THRESHOLD;

        return scrollY > HEADER_COLLAPSE_THRESHOLD;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    // 스크롤 할 때마다 handleScroll이 호출되므로, 성능 최적화를 위해 passive 옵션을 사용합니다.

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSiteHeaderNeeded]);

  if (!isSiteHeaderNeeded) return null;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const keyword = search.trim();

    if (!keyword) return;

    const params = new URLSearchParams({ q: keyword });
    router.push(`/search?${params.toString()}`);
  };

  const navItems = [
    {
      id: "course",
      title: "강의",
      src: "/images/course_logo.png",
      alt: "course",
    },
    {
      id: "challenge",
      title: "챌린지",
      src: "/images/roadmap_logo.png",
      alt: "challenge",
      isNew: true,
    },
    {
      id: "mentoring",
      title: "멘토링",
      src: "/images/mentoring_logo.png",
      alt: "mentoring",
    },
    {
      id: "clip",
      title: "클립",
      src: "/images/clip_logo.avif",
      alt: "clip",
      isNew: true,
    },
    {
      id: "roadmap",
      title: "로드맵",
      src: "/images/roadmap_logo.png",
      alt: "roadmap",
    },
  ];

  const renderSearchField = (isInactive: boolean) => (
    <div className="relative flex h-full w-full items-center rounded-full border border-[#d9dee3] bg-white shadow-sm transition-shadow focus-within:border-[#00c471] focus-within:shadow-md">
      <div className="ml-5 flex items-center gap-1.5">
        <Image
          src="/images/course_logo.png"
          alt=""
          width={32}
          height={32}
          className="size-8 object-contain"
        />
        <span className="text-[10px] text-[#6b737c]">▾</span>
      </div>
      <Input
        type="text"
        placeholder="요즘 관심 있는 주제나 기술이 있나요?"
        className="h-full flex-1 border-0 bg-transparent px-4 pr-16 text-[15px] text-[#212529] shadow-none placeholder:text-[#9aa3ad] focus-visible:border-0 focus-visible:ring-0 md:text-[15px]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={isInactive}
      />
      <button
        type="submit"
        className="absolute right-2.5 flex size-10 items-center justify-center rounded-full bg-[#00c471] text-white transition-colors hover:bg-[#00ad63] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#00c471]/30"
        aria-label="검색"
        disabled={isInactive}
      >
        <Search size={20} strokeWidth={3} />
      </button>
    </div>
  );

  return (
    <header className="site-header sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-8">
        <div className="grid min-h-[74px] grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 pt-2">
          <Link href="/" className="flex h-14 items-center">
            <Image
              src="/images/inflearn_public_logo.svg"
              alt="inflearn"
              width={117}
              height={48}
              className="h-auto w-[96px] sm:w-[117px]"
              priority
            />
          </Link>

          <div
            className={cn(
              "relative min-w-0 overflow-visible transition-[height] duration-300 ease-out",
              isScrolled ? "h-14" : "h-[118px]",
            )}
          >
            <nav
              className={cn(
                "absolute inset-x-0 top-0 flex h-14 min-w-0 items-center justify-start gap-4 overflow-x-auto scrollbar-none transition-all duration-300 ease-out sm:justify-center sm:gap-7",
                isScrolled
                  ? "pointer-events-none -translate-y-3 opacity-0"
                  : "translate-y-0 opacity-100",
              )}
              aria-hidden={isScrolled}
            >
              {navItems.map((item) => (
                <Link
                  href="#"
                  key={item.id}
                  className="group relative flex items-center gap-1.5 rounded-md px-1 py-2 text-[#212529] transition-colors hover:text-[#00c471]"
                  tabIndex={isScrolled ? -1 : undefined}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={34}
                    height={34}
                    className="size-[30px] object-contain sm:size-[34px]"
                  />
                  <span className="text-sm font-extrabold tracking-normal sm:text-base">
                    {item.title}
                  </span>
                  {item.isNew && (
                    <span className="absolute -right-2 top-1 flex size-4 items-center justify-center rounded-full bg-[#ff5b5b] text-[10px] font-bold leading-none text-white">
                      N
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <form
              onSubmit={handleSearchSubmit}
              className={cn(
                "absolute inset-x-0 mx-auto h-12 max-w-[560px] transition-all duration-300 ease-out",
                isScrolled ? "top-1" : "top-[64px]",
              )}
            >
              {renderSearchField(false)}
            </form>
          </div>

          <div className="flex h-14 shrink-0 items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="font-semibold border-gray-200 hover:border-[#1dc078] hover:text-[#1dc078]"
            >
              <Link href="/instructor">지식공유자</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-[#1dc078]"
            >
              <Link href="/carts" aria-label={`장바구니 ${cartItemCount}개`}>
                <ShoppingCart className="size-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] leading-none bg-[#ff5c5c] text-white hover:bg-[#ff5c5c]">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            {session ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="cursor-pointer rounded-full">
                    <Avatar>
                      {profile?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                  </button>
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
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none border-t border-gray-100"
                    onClick={() => router.push("/my/courses")}
                  >
                    <div className="font-semibold text-gray-800">내 학습</div>
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="font-semibold border-gray-200 hover:border-[#1dc078] hover:text-[#1dc078]"
              >
                <Link href="/signin">로그인</Link>
              </Button>
            )}
          </div>
        </div>

        {isCategoryNeeded && (
          <nav className="category-nav flex w-full gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none lg:justify-between">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/courses/${category.slug}`}
                className="shrink-0"
              >
                <div className="category-item flex flex-col items-center min-w-[72px] text-gray-700 hover:text-[#1dc078] cursor-pointer transition-colors">
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
      <div className="border-b"></div>
    </header>
  );
}
