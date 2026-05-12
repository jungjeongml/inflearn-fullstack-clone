import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Course, Prisma } from '@prisma/client';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import slugify from 'lib/slugify';
import { SearchCourseDto } from './dto/search-course.dto';
import { SearchCourseResponseDto } from './dto/search-response-dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createCourseDto: CreateCourseDto,
  ): Promise<Course> {
    return this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        slug: slugify(createCourseDto.title),
        instructorId: userId,
        status: 'DRAFT',
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CourseWhereUniqueInput;
    where?: Prisma.CourseWhereInput;
    orderBy?: Prisma.CourseOrderByWithRelationInput;
  }): Promise<Course[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.course.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(
    id: string,
    include?: Prisma.CourseInclude,
  ): Promise<Course | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include,
    });

    return course;
  }

  async update(
    id: string,
    userId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`ID: ${id} 코스를 찾을 수 없습니다.`);
    }

    const { categoryIds, ...otherData } = updateCourseDto;
    const data: Prisma.CourseUpdateInput = {
      ...otherData,
    };

    if (course.instructorId !== userId) {
      throw new UnauthorizedException('강의의 소유자만 수정할 수 있습니다.');
    }

    if (categoryIds && categoryIds.length > 0) {
      data.categories = {
        connect: categoryIds.map((id) => ({ id })),
      };
    }

    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`ID: ${id} 코스를 찾을 수 없습니다.`);
    }

    if (course.instructorId !== userId) {
      throw new UnauthorizedException('강의의 소유자만 삭제할 수 있습니다.');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return course;
  }

  async searchCourses(
    searchCourseDto: SearchCourseDto,
  ): Promise<SearchCourseResponseDto> {
    const { q, category, priceRange, sortBy, order, page, pageSize } =
      searchCourseDto;

    const where: Prisma.CourseWhereInput = {};
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    // 키워드 검색 (강의명, 강사명에서 부분 일치)
    if (q) {
      where.OR = [
        {
          title: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          instructor: {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // 카테고리 필터
    if (category) {
      where.categories = {
        some: {
          slug: category,
        },
      };
    }

    // 가격 범위 필터
    if (priceRange) {
      const priceConditions: Prisma.IntFilter = {};
      if (priceRange.min !== undefined) {
        priceConditions.gte = priceRange.min;
      }
      if (priceRange.max !== undefined) {
        priceConditions.lte = priceRange.max;
      }
      if (Object.keys(priceConditions).length > 0) {
        where.price = priceConditions;
      }
    }

    // 정렬 조건
    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.price = order as 'asc' | 'desc';
    }

    // 페이지네이션 계산
    const skip = (currentPage - 1) * currentPageSize;
    const totalItems = await this.prisma.course.count({ where });

    // 강의 목록 조회
    const courses = await this.prisma.course.findMany({
      where,
      orderBy,
      skip,
      take: currentPageSize,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(totalItems / currentPageSize);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    return {
      courses: courses as any[],
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        hasNext,
        hasPrev,
      },
    };
  }
}
