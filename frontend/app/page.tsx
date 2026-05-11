import { Metadata } from "next";

export const metadata: Metadata = {
  title: "인프런 - 온라인 IT 강의 플랫폼",
  description:
    "인프런은 개발자, 디자이너, 기획자 등 IT 분야의 전문가들이 온라인으로 강의를 제공하는 플랫폼입니다. 다양한 주제의 강의를 통해 지식을 쌓고 성장할 수 있습니다.",
};

export default function Home() {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center bg-white">
      <span className="text-6xl mb-4" style={{ color: "#00C471" }}>
        🎉
      </span>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#00C471" }}>
        Part 2 강좌를 기대해주세요!
      </h1>
    </div>
  );
}
