"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export default function CartUI() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<string[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    customerEmail: "",
    customerName: "",
    customerPhone: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const calculateDiscountPercentage = (
    originalPrice: number,
    discountPrice: number,
  ): number => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const cartItemsQuery = useQuery({
    queryFn: () => api.getCartItems(),
    queryKey: ["cart-items"],
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (courseId: string) => api.removeFromCart(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
    },
  });

  const cartItems = cartItemsQuery.data?.data?.items;
  const cartItemList = cartItems ?? [];
  const totalCartItemCount = cartItemsQuery.data?.data?.totalCount ?? 0;
  const selectedCartItemCount = selectedCartItemIds.length;
  const selectedCartItems = cartItemList.filter((item) =>
    selectedCartItemIds.includes(item.id),
  );
  const totalOriginalPrice = selectedCartItems.reduce(
    (sum, item) => sum + item.course.price,
    0,
  );
  const totalDiscountPrice = selectedCartItems.reduce(
    (sum, item) => sum + (item.course.discountPrice || item.course.price),
    0,
  );
  const totalDiscount = totalOriginalPrice - totalDiscountPrice;

  useEffect(() => {
    setSelectedCartItemIds(cartItems?.map((item) => item.id) ?? []);
  }, [cartItems]);

  const handleCartItemCheckedChange = (
    cartItemId: string,
    checked: boolean,
  ) => {
    setSelectedCartItemIds((prev) =>
      checked
        ? Array.from(new Set([...prev, cartItemId]))
        : prev.filter((id) => id !== cartItemId),
    );
  };

  const handlePayment = () => {
    if (
      !customerInfo.customerEmail ||
      !customerInfo.customerName ||
      !customerInfo.customerPhone
    ) {
      alert("구매자 정보를 모두 입력해주세요.");
      return;
    }
    alert("결제 기능은 준비 중입니다.");
  };

  if (cartItemsQuery.isLoading) {
    return <div>로딩중...</div>;
  }

  if (totalCartItemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">수강바구니</h1>
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">장바구니가 비어있습니다.</p>
          <Button onClick={() => router.push("/")} variant="outline">
            강의 둘러보기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">수강바구니</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* 좌측: 장바구니 아이템들 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              전체선택{" "}
              <span className="text-green-600">
                {selectedCartItemCount}/{totalCartItemCount}
              </span>
            </h2>
          </div>

          {cartItemList.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border rounded-lg bg-white"
            >
              <input
                type="checkbox"
                checked={selectedCartItemIds.includes(item.id)}
                onChange={(e) =>
                  handleCartItemCheckedChange(item.id, e.target.checked)
                }
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />

              <div className="relative w-24 h-16 flex-shrink-0">
                <Image
                  src={item.course.thumbnailUrl || "/placeholder-course.jpg"}
                  alt={item.course.title}
                  fill
                  className="rounded object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {item.course.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      로드맵 · 무제한 수강
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.course.instructor.name}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      {item.course.discountPrice &&
                        item.course.discountPrice < item.course.price && (
                          <span className="text-xs text-red-500 bg-red-50 px-1 py-0.5 rounded">
                            {calculateDiscountPercentage(
                              item.course.price,
                              item.course.discountPrice,
                            )}
                            % 할인
                          </span>
                        )}
                      <button
                        onClick={() =>
                          removeFromCartMutation.mutate(item.courseId)
                        }
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      {item.course.discountPrice &&
                      item.course.discountPrice < item.course.price ? (
                        <>
                          <div className="text-xs text-gray-400 line-through">
                            ₩{formatPrice(item.course.price)}
                          </div>
                          <div className="text-sm font-bold">
                            ₩{formatPrice(item.course.discountPrice)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-bold">
                          ₩{formatPrice(item.course.price)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 우측: 구매자 정보 및 결제 */}
        <div className="space-y-6">
          {/* 구매자 정보 */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold mb-4 flex items-center">
              구매자정보 <span className="text-red-500 ml-1">*</span>
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">이름 *</Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={customerInfo.customerName}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      customerName: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">이메일 *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={customerInfo.customerEmail}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      customerEmail: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">휴대폰 번호 *</Label>
                <div className="flex gap-2 mt-1">
                  <select className="border rounded-md px-3 py-2 text-sm">
                    <option>🇰🇷 대한민국 +82</option>
                  </select>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="휴대폰 번호 입력"
                    value={customerInfo.customerPhone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customerPhone: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 쿠폰 (구현 예정이므로 주석처리)
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold mb-4">쿠폰</h3>
            <div className="flex gap-2">
              <Input placeholder="쿠폰명을 입력해 주세요" className="flex-1" />
              <Button variant="outline">쿠폰선택</Button>
            </div>
          </div>
          */}

          {/* 포인트 (구현 예정이므로 주석처리)
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold mb-4">포인트</h3>
            <div className="flex gap-2">
              <Input placeholder="1,000원 이상 사용" className="flex-1" />
              <Button variant="outline">전액사용</Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">보유 0</p>
          </div>
          */}

          {/* 총 결제 금액 */}
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="font-semibold mb-4">총 결제 금액</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>₩{formatPrice(totalOriginalPrice)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>할인 금액</span>
                  <span>-₩{formatPrice(totalDiscount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>총 결제 금액</span>
                <span>₩{formatPrice(totalDiscountPrice)}</span>
              </div>
            </div>

            {/* 결제 버튼 */}
            <Button
              onClick={handlePayment}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            >
              결제하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
