"use server";

import { saltAndHashPassword } from "@/lib/password-utils";
import { prisma } from "@/prisma";
import { redirect } from "next/navigation";

function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string) {
  const hasTwoTypes =
    /(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[^A-Za-z0-9])|(?=.*\d)(?=.*[^A-Za-z0-9])/.test(
      password,
    );
  const isValidLength =
    password.length >= 8 && password.length <= 32 && !/\s/.test(password);
  const hasNoTripleRepeat = !/(.)\1\1/.test(password);

  if (!hasTwoTypes) {
    return "영문/숫자/특수문자 중, 2가지 이상 포함해야 합니다.";
  }
  if (!isValidLength) {
    return "8자 이상 32자 이하의 비밀번호를 입력해주세요.";
  }
  if (!hasNoTripleRepeat) {
    return "연속 3자 이상 동일한 문자/숫자는 사용할 수 없습니다.";
  }

  return null;
}

export async function signUp({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const passwordError = validatePassword(password);

  if (!validateEmail(email)) {
    return { status: "error", message: "올바른 이메일 형식을 입력해주세요." };
  }

  if (passwordError) {
    return { status: "error", message: passwordError };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return { status: "error", message: "이미 존재하는 이메일입니다." };
    }

    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword: saltAndHashPassword(password),
      },
    });

    if (user) {
      return { status: "ok" };
    }
  } catch (err) {
    console.error(err);
    return { status: "error", message: "회원가입에 실패했습니다." };
  }
}
