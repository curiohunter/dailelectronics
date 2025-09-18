"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/landing/AnimatedCounter"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { MobileMenu } from "@/components/landing/MobileMenu"
import { DailLogo } from "@/components/DailLogo"
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  Package, 
  Briefcase,
  Shield,
  Zap,
  Users,
  Clock,
  Award,
  AlertCircle,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Wrench,
  Factory
} from "lucide-react"

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // 고객 후기 데이터
  const testimonials = [
    {
      id: 1,
      name: "김대표",
      company: "한성전기",
      content: "다일전기와 거래한지 10년이 넘었습니다. 항상 신속한 배송과 우수한 품질로 만족하고 있습니다.",
      rating: 5
    },
    {
      id: 2,
      name: "이사장",
      company: "미래조명",
      content: "급하게 필요한 부품도 빠르게 대응해주셔서 감사합니다. 다일전기 덕분에 현장 일정을 맞출 수 있었습니다.",
      rating: 5
    },
    {
      id: 3,
      name: "박대표",
      company: "대한전력설비",
      content: "다양한 재고와 합리적인 가격, 무엇보다 신뢰할 수 있는 파트너입니다.",
      rating: 5
    },
    {
      id: 4,
      name: "최사장",
      company: "신영전자",
      content: "전문적인 기술 상담과 제품 추천이 정말 도움이 됩니다. 앞으로도 계속 거래하고 싶습니다.",
      rating: 5
    },
    {
      id: 5,
      name: "정대표",
      company: "일성엔지니어링",
      content: "긴급 주문에도 항상 친절하게 대응해주시고, 품질도 일정합니다. 믿고 거래하는 업체입니다.",
      rating: 5
    }
  ]

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "저가 자재 NO → 고장률 DOWN",
      description: "검증된 부품만 사용해 라인 멈춤(다운타임) 위험을 줄입니다.",
      highlight: "고장률 최소화"
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "2-3회 상담·정밀 설계",
      description: "실제 구동 방식과 정확한 스펙을 기준으로 설계하여 재작업이 거의 없습니다.",
      highlight: "수정 최소화"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "한 번 쓰면 오래·계속",
      description: "무고장·장수명을 지향해 재구매·지속 거래 비율이 높습니다.",
      highlight: "장기 신뢰성"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "제작 + 자재 판매 동시 운영",
      description: "자재 수급이 빨라 납품·A/S 대응이 신속합니다.",
      highlight: "빠른 대처"
    }
  ]

  const stats = [
    { number: "1,400+", label: "거래처", icon: <Users className="w-5 h-5" /> },
    { number: "300+", label: "매입처", icon: <Factory className="w-5 h-5" /> },
    { number: "12,000+", label: "취급 품목", icon: <Package className="w-5 h-5" /> },
    { number: "15년", label: "전문 경력", icon: <Award className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <DailLogo size="md" />
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">회사소개</Link>
              <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">핵심가치</Link>
              <Link href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">문의하기</Link>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/login">로그인</Link>
              </Button>
            </div>
            <MobileMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax Effect */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-blue-950/20 dark:via-gray-950 dark:to-gray-900" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              20년 이상 전문 경력
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              멈추지 않게,<br />
              오래 가는 판넬
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-4 font-medium">
              전기자재 판매 & 맞춤형 컨트롤 판넬 제작
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-500 mb-8">
              설비에 최적화된 제어로 원하는 동작을 정확하고 안전하게 구현합니다
            </p>

            {/* CTA Buttons with hover animations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <a href="http://pf.kakao.com/_xkdpfs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  상담 예약하기
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <a href="http://pf.kakao.com/_xkdpfs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  재고·단가 문의
                </a>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <a href="https://blog.naver.com/samsang380" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  포트폴리오 보기
                </a>
              </Button>
            </div>

            {/* Trust Indicators with Animated Counters */}
            <div className="flex flex-wrap justify-center gap-8">
              <ScrollReveal delay={0}>
                <div className="flex items-center gap-2">
                  <div className="text-blue-600"><Users className="w-5 h-5" /></div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter end={1400} suffix="+" />
                    </div>
                    <div className="text-sm text-gray-500">거래처</div>
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal delay={100}>
                <div className="flex items-center gap-2">
                  <div className="text-blue-600"><Factory className="w-5 h-5" /></div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter end={300} suffix="+" />
                    </div>
                    <div className="text-sm text-gray-500">매입처</div>
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal delay={200}>
                <div className="flex items-center gap-2">
                  <div className="text-blue-600"><Package className="w-5 h-5" /></div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter end={12000} suffix="+" />
                    </div>
                    <div className="text-sm text-gray-500">취급 품목</div>
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal delay={300}>
                <div className="flex items-center gap-2">
                  <div className="text-blue-600"><Award className="w-5 h-5" /></div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      <AnimatedCounter end={20} suffix="년+" />
                    </div>
                    <div className="text-sm text-gray-500">전문 경력</div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4 mb-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">고객사 후기</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              다일전기와 함께하는 파트너사들의 생생한 이야기
            </p>
          </div>
        </div>

        {/* Infinite Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`flex gap-4 md:gap-6 ${isPaused ? '' : 'animate-scroll'}`}>
            {/* Double the testimonials for seamless infinite scroll */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="flex-shrink-0 w-[320px] md:w-[400px]"
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 mx-2">
                  <CardContent className="p-6">
                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[80px]">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="border-t pt-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* CSS for infinite scroll animation */}
        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .animate-scroll {
            animation: scroll 30s linear infinite;
          }

          @media (max-width: 768px) {
            .animate-scroll {
              animation: scroll 25s linear infinite;
            }
          }
        `}</style>
      </section>

      {/* Why Choose Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              왜 돌고 돌아 다일전기로 오셨을까요?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              값싸게 급히 만들지 않습니다. 고장률이 낮고, 오래 쓸 수 있는 판넬을 제작합니다.
            </p>
          </div>

          {/* Bento Box Layout for Features with ScrollReveal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-gray-200 dark:border-gray-800 overflow-hidden h-full">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <Badge className="mb-2 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                          {feature.highlight}
                        </Badge>
                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">검증된 규모와 신뢰</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  1,400+ 거래처, 300+ 매입처, 12,000+ 취급 품목으로 다양한 현장 커버가 가능합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">대기 일정 안내</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  진행 중인 제작 건이 있을 수 있으니 여유를 두고 문의해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-blue-200 dark:border-blue-900">
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <Badge className="mb-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                    Important Notice
                  </Badge>
                  <h3 className="text-2xl font-bold mb-4">가격만 보신다면 맞지 않을 수 있습니다</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    단순히 가장 저렴한 판넬을 원하신다면 다른 업체를 추천드립니다.
                  </p>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                  <h4 className="font-semibold mb-4 text-center">다일전기는 이런 분들께 적합합니다</h4>
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>생산 라인 중단으로 인한 손실을 최소화하고 싶으신 분</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>한 번 설치 후 오랫동안 안정적으로 사용하고 싶으신 분</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>정확한 사양과 꼼꼼한 설계를 원하시는 분</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>신속한 A/S와 지속적인 관리를 원하시는 분</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">
              지금 바로 상담 받아보세요
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              20년 이상 경력의 전문가가 귀사에 최적화된 솔루션을 제안해 드립니다
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
                asChild
              >
                <a href="http://pf.kakao.com/_xkdpfs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  카카오톡 상담
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10"
                asChild
              >
                <a href="tel:031-123-4567" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  전화 문의
                </a>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>031-990-9444</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>9909444@naver.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>경기 김포시 양촌읍 황금4로 99 학운중앙유통상가 1층 104호</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <DailLogo size="sm" className="text-gray-300" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm">© 2025 다일전기. All rights reserved.</p>
              <p className="text-xs mt-1">사업자등록번호: 217-29-01118</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}