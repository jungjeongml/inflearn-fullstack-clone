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
import { CourseDetailDto } from './dto/course-detail.dto';
import { CourseFavorite as CourseFavoriteEntity } from 'src/_gen/prisma-class/course_favorite';
import { GetFavoriteResponseDto } from './dto/favorite.dto';

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

  async findOne(id: string): Promise<CourseDetailDto | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        categories: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        enrollments: true,
        sections: {
          include: {
            _count: {
              select: {
                lectures: true,
              },
            },
            lectures: {
              select: {
                id: true,
                title: true,
                isPreview: true,
                duration: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            lectures: true,
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // 평균 평점 계산
    const averageRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) /
          course.reviews.length
        : 0;

    // 총 렉처 수 계산
    const totalLectures = course.sections.reduce(
      (sum, section) => sum + section._count.lectures,
      0,
    );

    // 총 강의 시간 계산
    const totalDuration = course.sections.reduce(
      (sum, section) =>
        sum +
        section.lectures.reduce(
          (lecSum, lecture) => lecSum + (lecture.duration || 0),
          0,
        ),
      0,
    );

    const result = {
      ...course,
      totalEnrollments: course._count.enrollments,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: course._count.reviews,
      totalLectures,
      totalDuration,
    };

    return result as unknown as CourseDetailDto;
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

  async addFavorite(courseId: string, userId: string): Promise<boolean> {
    try {
      const existingFavorite = await this.prisma.courseFavorite.findFirst({
        where: {
          userId,
          courseId,
        },
      });
      if (existingFavorite) {
        return true;
      }

      await this.prisma.courseFavorite.create({
        data: {
          userId,
          courseId,
        },
      });

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async removeFavorite(courseId: string, userId: string): Promise<boolean> {
    try {
      const existingFavorite = await this.prisma.courseFavorite.findFirst({
        where: {
          userId,
          courseId,
        },
      });
      if (existingFavorite) {
        await this.prisma.courseFavorite.delete({
          where: {
            id: existingFavorite.id,
          },
        });
        return true;
      }

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getFavorite(
    courseId: string,
    userId?: string,
  ): Promise<GetFavoriteResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`${courseId} 코스를 찾지 못했습니다.`);
    }

    if (userId) {
      const existingFavorite = await this.prisma.courseFavorite.findFirst({
        where: {
          userId,
          courseId,
        },
      });
      return {
        isFavorite: !!existingFavorite,
        favoriteCount: course._count.favorites,
      };
    } else {
      return {
        isFavorite: false,
        favoriteCount: course._count.favorites,
      };
    }
  }

  async getMyFavorites(userId: string): Promise<CourseFavoriteEntity[]> {
    const existingFavorites = await this.prisma.courseFavorite.findMany({
      where: {
        userId,
      },
    });

    return existingFavorites as unknown as CourseFavoriteEntity[];
  }
}
