import { PrismaClient } from '@prisma/client';
import {v4 as uuidv4} from 'uuid'

const prisma = new PrismaClient

async function main(){
  await prisma.$connect();
  //기존에 존재하는 카테고리 삭제
  await prisma.courseCategory.deleteMany({})

  const categories = [
    {
      id: uuidv4(),
      name:'개발 · 프로그래밍',
      slug:'it-programming',
      description:'', 
    },
    {
      id:uuidv4(),
      name:'게임 개발',
      slug:'game-dev-all',
      description:'',
    },
    {
      id:uuidv4(),
      name:'데이터 사이언스',
      slug:'data-science',
      description:'',
    },
    {
      id:uuidv4(),
      name:'보안 · 네트워크',
      slug:'it',
      description:'',
    },
    {
      id:uuidv4(),
      name:'하드웨어',
      slug:'hardware',
      description:'',
    },
    {
      id:uuidv4(),
      name:'디자인 · 아트',
      slug:'design',
      description:'',
    },
    {
      id:uuidv4(),
      name:'기획 · 경영 · 마케팅',
      slug:'business',
      description:'',
    },
    {
      id:uuidv4(),
      name:'외국어',
      slug:'foreign-language',
      description:'',
    },
    {
      id:uuidv4(),
      name:'업무 생산성',
      slug:'productivity',
      description:'',
    },
    {
      id:uuidv4(),
      name:'커리어 · 자기계발',
      slug:'career',
      description:'',
    },
    {
      id:uuidv4(),
      name:'대학 교육',
      slug:'academics',
      description:'',
    }
  ]

  await prisma.courseCategory.createMany({
    data:categories
  })

  console.log('Seeded categories successfully');
}

main().catch((error) => {
  console.error('Error seeding categories:', error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});