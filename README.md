# 다일전기 미수금 관리 시스템 (Dail Electronics Receivables Management System)

## 📋 프로젝트 소개

다일전기의 **미수금 발생 예방** 및 **체계적인 단계별 관리**를 위한 통합 직원 전용 시스템입니다.
세금계산서 발행과 입금 내역을 자동으로 매칭하여 미수금이 장기 미수금으로 전환되는 것을 방지합니다.

### 🔐 보안 및 접근 제어
- **직원 전용**: 첫 번째 가입자가 관리자가 되며 이후 가입자를 승인
- **인증 시스템**: Supabase Auth를 통한 안전한 로그인/로그아웃
- **미들웨어 보호**: 비인증 사용자는 랜딩, 로그인, 회원가입 페이지만 접근 가능
- **승인 시스템**: 신규 가입자는 관리자 승인 후 시스템 접근 가능
- **랜딩 페이지**: 다일전기 소개 및 브랜딩 페이지

### 핵심 목표
- 🎯 **미수금 발생 예방**: 실시간 모니터링 및 자동 알림
- 📊 **단계별 관리**: 30일/60일/90일 단위 체계적 관리
- ⚡ **자동화**: 입금-세금계산서 자동 매칭으로 업무 효율화
- 📈 **가시성**: 대시보드를 통한 현금 흐름 실시간 파악

## 🚀 주요 기능

### 1. 미수금 예방 기능
- **실시간 대시보드**: 미수금 현황 즉시 파악
- **30일 경과 알림**: 장기 미수금 전환 방지
- **거래처별 신용 관리**: 거래처별 미수 패턴 분석
- **자동 매칭**: 입금 시 자동으로 세금계산서와 매칭

### 2. 단계별 미수금 관리
```
📅 30일 이내 (정상)
  ├─ 자동 매칭 진행
  └─ 일반 관리
  
⚠️ 30-60일 (주의)
  ├─ 우선 수금 대상 표시
  └─ 담당자 알림
  
🚨 60-90일 (경고)
  ├─ 긴급 수금 필요
  └─ 특별 관리 대상
  
❌ 90일 초과 (위험)
  ├─ 장기 미수금 전환
  └─ 경영진 보고 대상
```

### 3. 파일 업로드 및 처리
- **세금계산서 업로드**: CSV/Excel 형식 지원
- **은행 입금내역 업로드**: 신한은행 등 주요 은행 형식 지원
- **자동 거래처 생성**: 신규 거래처 자동 등록
- **중복 방지**: 승인번호 기반 중복 체크

### 4. 스마트 매칭 시스템
- **별칭 기반 자동 매칭**: alias_names 배열로 다양한 입금자명 인식
- **총액 기반 계산**: 미수금 = 세금계산서 총액 - 입금 총액
- **관계 테이블 활용**: 원본 데이터 보존하며 유연한 연결 관리
- **NULL 허용 설계**: 매칭 안 된 데이터도 시스템에 보관

## 💻 기술 스택

- **Frontend**: Next.js 15.1.4, React 19.0.0, TypeScript 5.7.2
- **UI Framework**: Tailwind CSS 3.4.17, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **File Processing**: xlsx 0.18.5, Papa Parse 5.4.1, csv-parse 5.6.0
- **Icons**: Lucide React 0.468.0
- **Date**: date-fns 4.1.0

## 🛠️ 설치 및 실행

### 사전 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 계정

### 1. 프로젝트 클론
```bash
git clone [repository-url]
cd payment_tracking_dail-electronics
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 입력:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📊 데이터베이스 구조

### 관계 테이블 중심 설계 (5개 테이블)

#### 핵심 테이블 (원본 데이터 보존)
- **customers**: 거래처 마스터 데이터
  - 사업자등록번호, 회사명, 대표자명
  - alias_names (별칭 배열) - 입금자명 자동 매칭용
  - 전화번호, 이메일, 주소, 메모
  
- **tax_invoices**: 세금계산서 원본
  - 국세청 데이터 그대로 보존
  - buyer_company_name (공급받는자)
  - total_amount (총액)
  - ❌ customer_id 없음 (관계 테이블로 관리)
  
- **bank_deposits**: 입금내역 원본  
  - 은행 데이터 그대로 보존
  - deposit_name (입금자명)
  - deposit_amount (입금액)
  - ❌ customer_id 없음 (관계 테이블로 관리)

#### 관계 테이블 (연결 관리)
- **customer_tax_invoices**: 거래처 ↔ 세금계산서 연결
  - customer_id (nullable) - 매칭 안 된 경우 NULL
  - tax_invoice_id (unique)
  
- **customer_bank_deposits**: 거래처 ↔ 입금내역 연결
  - customer_id (nullable) - 매칭 안 된 경우 NULL
  - bank_deposit_id (unique)

## 📱 주요 화면

### 랜딩 페이지 (`/`)
- **브랜딩 페이지**: 다일전기 소개 및 핵심 가치 전달
- **상담 연결**: 카카오톡 상담 및 전화 문의 링크
- **로그인 연결**: 직원 전용 시스템 진입점

### 인증 시스템
- **로그인 (`/login`)**: 직원 이메일/비밀번호 로그인
- **회원가입 (`/signup`)**: 신규 직원 등록 (첫 번째 가입자는 자동 관리자)
- **직원 관리 (`/employees`)**: 직원 활성화/비활성화 및 권한 관리

### 대시보드 (`/dashboard`)
- **월별 통계 카드**
  - 거래업체 수
  - 세금계산서 총액
  - 수금 완료/미수금 현황
  
- **미수금 관리 테이블**
  - 업체별 미수금 현황 (FIFO 방식)
  - 전체 컬럼 정렬 기능 (한국어 가나다순 지원)
  - 상태별 필터 (전체/수금완료/미수금/30일+/60일+/90일+/과납)
  - 경과일별 색상 코딩 (30일/60일/90일)
  
- **거래처 상세 모달**
  - 세금계산서/입금 내역 리스트
  - 거래처 메모 기능
  - 전화번호 즉시 확인

### 데이터 관리 센터 (`/matching`) 
- **파일 업로드**
  - 세금계산서 CSV 업로드
  - 입금내역 Excel 업로드
  - 자동 관계 생성
  
- **통합 CRUD (4개 탭)**
  - 고객사 탭: 회사 정보 + 별칭 관리
  - 세금계산서 탭: 원본 데이터 + 연결 상태 + CRUD 기능
  - 입금내역 탭: 원본 데이터 + 연결 상태 + CRUD 기능
  - 관계 테이블 탭: 수동 연결 관리

### 거래처 관리 (`/customers`)
- 거래처 정보 CRUD
- 별칭(alias_names) 배열 관리
- 대표자명 자동 별칭 추가

### 직원 관리 (`/employees`)
- 직원 목록 조회 및 상태 관리
- 직원 활성화/비활성화 (관리자 기능)
- 직원별 관리자 권한 설정
- 직원 계정 완전 삭제 기능

## 📝 사용 가이드

### 1. 초기 설정
1. 거래처 정보 등록
2. 거래처 별칭 설정 (중요!)
3. 기존 데이터 업로드

### 2. 일일 운영
1. 세금계산서 파일 업로드 (일/주/월 단위)
2. 은행 입금내역 업로드 (일 단위 권장)
3. 자동 매칭 실행
4. 미매칭 건 수동 처리

### 3. 미수금 관리
1. 대시보드에서 30일 경과 미수금 확인
2. 상세 모달에서 거래처별 내역 확인
3. 우선순위에 따라 수금 활동 진행
4. 장기 미수금 특별 관리

## 🔄 데이터 업로드 형식

### 세금계산서 (CSV)
- 한국 전자세금계산서 표준 형식
- 필수 필드: 승인번호, 공급받는자, 합계금액, 발급일자

### 은행 입금내역 (Excel)
- 신한은행 등 주요 은행 거래내역 형식
- 필수 필드: 거래일자, 입금액, 입금자명

## ⚠️ 주의사항

- 거래처 별칭을 정확히 설정해야 자동 매칭률이 향상됩니다
- 대표자명은 자동으로 별칭에 포함됩니다
- 30일 경과 미수금은 즉시 확인하여 조치하세요
- 정기적인 데이터 백업을 권장합니다

## 📞 지원

문제 발생 시 다음 정보와 함께 문의:
- 오류 메시지 스크린샷
- 사용 중인 브라우저
- 업로드한 파일 샘플 (민감정보 제거)

## 🏗️ 프로젝트 구조

```
/src
  /app                    # Next.js 15 App Router
    page.tsx              # 랜딩 페이지 (루트)
    /landing              # 랜딩 페이지 컴포넌트
    /login                # 로그인 페이지 + 액션
    /signup               # 회원가입 페이지 + 설정
    /dashboard            # 대시보드 페이지 (인증 필요)
    /matching             # 데이터 관리 센터 (인증 필요)
    /customers            # 거래처 관리 (인증 필요)
    /employees            # 직원 관리 (인증 필요)
    /api
      /upload             # 파일 업로드 API (CSV/Excel)
      /employees          # 직원 관리 API
        /delete-auth      # Auth 사용자 삭제 API
  
  /components
    /landing              # 랜딩 페이지 컴포넌트
      AnimatedCounter.tsx # 애니메이션 카운터
      MobileMenu.tsx      # 모바일 네비게이션
      ScrollReveal.tsx    # 스크롤 애니메이션
    /dashboard            # 대시보드 컴포넌트
      DashboardStats.tsx  # 통계 카드
      ReceivablesTable.tsx# 미수금 테이블
      CustomerDetailModal.tsx # 거래처 상세 모달
    /matching             # 매칭 관련 컴포넌트
      FileUploadCard.tsx  # 파일 업로드 카드
      TaxInvoicesTab.tsx  # 세금계산서 탭 (CRUD)
      BankDepositsTab.tsx # 입금내역 탭 (CRUD)
      RelationshipsTab.tsx# 관계 테이블 탭
      *Modal.tsx          # 각종 모달 컴포넌트
    /employees            # 직원 관리 컴포넌트
      EmployeeTable.tsx   # 직원 목록 테이블
      EmployeeForm.tsx    # 직원 등록 폼
    /layout               # 레이아웃 컴포넌트
      dashboard-layout.tsx# 대시보드 레이아웃
      sidebar.tsx         # 사이드바 (다크모드, 로그아웃)
    /ui                   # shadcn/ui 컴포넌트
    DailLogo.tsx          # 다일전기 로고 컴포넌트
  
  /lib
    /supabase             # Supabase 설정
      client.ts           # 클라이언트 설정
      server.ts           # 서버 설정
      middleware.ts       # 인증 미들웨어
    /auth                 # 인증 헬퍼
    utils.ts              # 유틸리티 함수
  
  /services
    file-parser.ts        # CSV/Excel 파싱 서비스
  
  /types
    database.types.ts     # 데이터베이스 타입 정의
  
  middleware.ts           # Next.js 미들웨어 (라우트 보호)

/docs                     # 프로젝트 문서
  auth-architecture.md    # 인증 시스템 아키텍처
  database-design.md      # 데이터베이스 설계
  employee-management.md  # 직원 관리 시스템
  implementation-guide.md # 구현 가이드
  development-roadmap.md  # 개발 로드맵
```

## 🔜 향후 계획

- [ ] 자동 수금 알림 (이메일/SMS)
- [ ] 거래처 신용등급 자동 평가
- [ ] 수금 예측 AI 모델
- [ ] 모바일 앱 개발
- [ ] 회계 시스템 연동
- [ ] 수금 실적 리포트 자동 생성
- [ ] 대량 데이터 페이지네이션

## 📄 라이선스

© 2025 다일전기. All rights reserved.

---

**개발**: 다일전기 IT팀  
**버전**: 0.1.0  
**최종 업데이트**: 2025년 1월