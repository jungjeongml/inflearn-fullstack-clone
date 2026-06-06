"use client";

import { useState } from "react";
import { signUp } from "@/app/actions/auth-actions";
import { redirect } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function UI() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const passwordRules = [
    {
      label: "영문/숫자/특수문자 중, 2가지 이상 포함",
      valid:
        /(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[^A-Za-z0-9])|(?=.*\d)(?=.*[^A-Za-z0-9])/.test(
          password,
        ),
    },
    {
      label: "8자 이상 32자 이하 입력 (공백 제외)",
      valid:
        password.length >= 8 && password.length <= 32 && !/\s/.test(password),
    },
    {
      label: "연속 3자 이상 동일한 문자/숫자 제외",
      valid: !/(.)\1\1/.test(password),
    },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    const result = await signUp({
      email,
      password,
    });
    if (result?.status === "ok") {
      redirect("/signin");
    }

    if (result?.message) {
      alert(result.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-126px)] flex-col items-center justify-center gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 min-w-[300px]"
      >
        <FieldGroup className="gap-2">
          <FieldSet className="items-center text-center">
            <h1 className="text-center text-2xl font-bold">회원가입</h1>
            <FieldDescription className="text-gray-700">
              인프런에서 다양한 학습의 기회를 얻으세요
            </FieldDescription>
          </FieldSet>
          <Field>
            <FieldLabel htmlFor="email"></FieldLabel>
            <Input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  e.target.value,
                );
                setIsEmailValid(isValid);
              }}
              type="email"
              name="email"
              placeholder="이메일 입력"
              className="h-12 rounded-sm border-2 text-lg md:text-lg"
            />
            <FieldError
              className={`text-sm text-destructive flex items-center ${isEmailValid ? "hidden" : ""}`}
            >
              <X></X>
              <span className="pt-[2px]">이메일 형식이 올바르지 않습니다.</span>
            </FieldError>
          </Field>
          <Popover open={passwordFocused}>
            <PopoverAnchor asChild>
              <div
                onFocusCapture={() => setPasswordFocused(true)}
                onBlurCapture={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setPasswordFocused(false);
                  }
                }}
              >
                <InputGroup className="h-12 rounded-sm border-2">
                  <InputGroupInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="비밀번호 입력"
                    className="text-lg md:text-lg"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </PopoverAnchor>

            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="w-[300px] rounded-sm border border-gray-200 p-4 text-red-500 shadow-sm"
            >
              <ul className="flex flex-col gap-2 text-xs">
                {passwordRules.map((rule) => (
                  <li
                    key={rule.label}
                    className={rule.valid ? "text-green-600" : "text-red-500"}
                  >
                    <X className="mr-2 inline size-3" />
                    {rule.label}
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          <InputGroup className="h-12 rounded-sm border-2">
            <InputGroupInput
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type={showPasswordConfirm ? "text" : "password"}
              name="passwordConfirm"
              placeholder="비밀번호 확인"
              className="text-lg md:text-lg"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
              >
                {showPasswordConfirm ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </FieldGroup>

        <Button
          type="submit"
          className="h-12 bg-green-500 text-white font-bold cursor-pointer rounded-sm p-4 text-lg"
        >
          새 계정으로 계속
        </Button>
      </form>
      <div className="flex w-[300px] items-center gap-3 text-sm text-gray-500 before:h-px before:flex-1 before:bg-gray-300 before:content-[''] after:h-px after:flex-1 after:bg-gray-300 after:content-['']">
        <span>또는</span>
      </div>
      <button
        type="button"
        className="gsi-material-single-button"
        onClick={() => signIn("google", { redirectTo: "/" })}
      >
        <div className="gsi-material-single-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            style={{
              display: "block",
              fill: "currentColor",
            }}
            className="size-5"
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
          <span style={{ display: "none" }}>Sign in with Google</span>
        </div>
      </button>
    </div>
  );
}
