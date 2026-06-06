"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function UI() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  };

  return (
    <div className="flex min-h-[calc(100svh-126px)] flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-gray-700 text-sm">
          인프런 계정으로 로그인할 수 있어요
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 min-w-[300px]"
      >
        <label htmlFor="email">이메일</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          name="email"
          placeholder="exammple@inflab.com"
          className="border-2 border-gray-300 rounded-sm p-2"
        />
        <label htmlFor="password">비밀번호</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          name="password"
          placeholder="********"
          className="border-2 border-gray-300 rounded-sm p-2"
        />
        <button
          type="submit"
          className="flex h-10 items-center justify-center rounded-sm bg-green-500 font-bold text-white cursor-pointer"
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => signIn("google", { redirectTo: "/" })}
          className="gsi-material-button"
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{ display: "block" }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents">
              Google로 로그인
            </span>
          </div>
        </button>
        <Button
          variant="outline"
          asChild
          className="h-10 rounded-sm border-gray-300 font-bold text-gray-700 border-2 text-md"
        >
          <Link href="/signup">회원가입</Link>
        </Button>
      </form>
    </div>
  );
}
