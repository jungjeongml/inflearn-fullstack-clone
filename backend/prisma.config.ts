import "dotenv/config";

// Prisma CLI가 schema 위치를 찾는 용도입니다.
// DATABASE_URL은 `.env`/환경변수로 로드되도록 두고, 타입체크가 깨지지 않게 최소 설정만 유지합니다.
export default {
  schema: "prisma/schema.prisma",
};
