-- ============================================
-- 다일전기 미수금 관리 시스템 데이터베이스 스키마
-- Version: 1.0.0
-- Date: 2025-01-18
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLES CREATION
-- ============================================

-- 거래처 테이블
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_number VARCHAR(20) UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(100),
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    customer_type VARCHAR(50) DEFAULT 'REGULAR',
    alias_names TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 세금계산서 테이블
CREATE TABLE IF NOT EXISTS tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_number VARCHAR(50) UNIQUE,
    issue_date DATE NOT NULL,
    creation_date DATE,
    transmission_date DATE,
    supplier_business_number VARCHAR(20),
    supplier_company_name VARCHAR(255),
    supplier_representative VARCHAR(100),
    supplier_address TEXT,
    supplier_email VARCHAR(255),
    buyer_business_number VARCHAR(20),
    buyer_company_name VARCHAR(255),
    buyer_representative VARCHAR(100),
    buyer_address TEXT,
    buyer_email VARCHAR(255),
    total_amount NUMERIC(15, 2) NOT NULL,
    supply_amount NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) NOT NULL,
    invoice_type VARCHAR(50) DEFAULT 'TAX_INVOICE',
    invoice_category VARCHAR(50) DEFAULT 'GENERAL',
    issue_type VARCHAR(50) DEFAULT 'ASP',
    transaction_type VARCHAR(50) NOT NULL,
    item_date DATE,
    item_name TEXT,
    item_specification TEXT,
    item_quantity NUMERIC(10, 2),
    item_unit_price NUMERIC(15, 2),
    item_supply_amount NUMERIC(15, 2),
    item_tax_amount NUMERIC(15, 2),
    item_remarks TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 입금내역 테이블
CREATE TABLE IF NOT EXISTS bank_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    transaction_time TIME,
    transaction_type VARCHAR(50),
    deposit_amount NUMERIC(15, 2) NOT NULL,
    withdrawal_amount NUMERIC(15, 2) DEFAULT 0,
    deposit_name VARCHAR(255),
    balance NUMERIC(15, 2),
    branch_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 거래처-세금계산서 연결 테이블
CREATE TABLE IF NOT EXISTS customer_tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    tax_invoice_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 거래처-입금내역 연결 테이블
CREATE TABLE IF NOT EXISTS customer_bank_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    bank_deposit_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 기타입금 분류 테이블
CREATE TABLE IF NOT EXISTS bank_deposit_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_deposit_id UUID NOT NULL UNIQUE,
    classification_type VARCHAR(50) NOT NULL CHECK (classification_type IN ('internal', 'external')),
    classification_detail TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 직원 테이블 (단순화됨 - 초대 코드 제거)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    auth_user_id UUID,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. FOREIGN KEY CONSTRAINTS
-- ============================================

-- 거래처-세금계산서 연결
ALTER TABLE customer_tax_invoices
    ADD CONSTRAINT customer_tax_invoices_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    ADD CONSTRAINT customer_tax_invoices_tax_invoice_id_fkey
    FOREIGN KEY (tax_invoice_id) REFERENCES tax_invoices(id) ON DELETE CASCADE;

-- 거래처-입금내역 연결
ALTER TABLE customer_bank_deposits
    ADD CONSTRAINT customer_bank_deposits_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    ADD CONSTRAINT customer_bank_deposits_bank_deposit_id_fkey
    FOREIGN KEY (bank_deposit_id) REFERENCES bank_deposits(id) ON DELETE CASCADE;

-- 기타입금 분류
ALTER TABLE bank_deposit_classifications
    ADD CONSTRAINT bank_deposit_classifications_bank_deposit_id_fkey
    FOREIGN KEY (bank_deposit_id) REFERENCES bank_deposits(id) ON DELETE CASCADE;

-- 직원 인증 연결 (Supabase Auth)
ALTER TABLE employees
    ADD CONSTRAINT employees_auth_user_id_fkey
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================
-- 3. INDEXES
-- ============================================

-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_business_number ON customers(business_number);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_issue_date ON tax_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_buyer_company_name ON tax_invoices(buyer_company_name);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_transaction_date ON bank_deposits(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_deposit_name ON bank_deposits(deposit_name);
CREATE INDEX IF NOT EXISTS idx_customer_tax_invoices_customer_id ON customer_tax_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_bank_deposits_customer_id ON customer_bank_deposits(customer_id);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_bank_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_deposit_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자만 모든 작업 가능
-- 거래처
CREATE POLICY "Authenticated users can view customers" ON customers
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON customers
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON customers
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete customers" ON customers
    FOR DELETE TO authenticated USING (true);

-- 세금계산서
CREATE POLICY "Authenticated users can view tax_invoices" ON tax_invoices
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tax_invoices" ON tax_invoices
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tax_invoices" ON tax_invoices
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete tax_invoices" ON tax_invoices
    FOR DELETE TO authenticated USING (true);

-- 입금내역
CREATE POLICY "Authenticated users can view bank_deposits" ON bank_deposits
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank_deposits" ON bank_deposits
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank_deposits" ON bank_deposits
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete bank_deposits" ON bank_deposits
    FOR DELETE TO authenticated USING (true);

-- 거래처-세금계산서 연결
CREATE POLICY "Authenticated users can view customer_tax_invoices" ON customer_tax_invoices
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customer_tax_invoices" ON customer_tax_invoices
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customer_tax_invoices" ON customer_tax_invoices
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete customer_tax_invoices" ON customer_tax_invoices
    FOR DELETE TO authenticated USING (true);

-- 거래처-입금내역 연결
CREATE POLICY "Authenticated users can view customer_bank_deposits" ON customer_bank_deposits
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customer_bank_deposits" ON customer_bank_deposits
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customer_bank_deposits" ON customer_bank_deposits
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete customer_bank_deposits" ON customer_bank_deposits
    FOR DELETE TO authenticated USING (true);

-- 기타입금 분류
CREATE POLICY "Authenticated users can view bank_deposit_classifications" ON bank_deposit_classifications
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bank_deposit_classifications" ON bank_deposit_classifications
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bank_deposit_classifications" ON bank_deposit_classifications
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete bank_deposit_classifications" ON bank_deposit_classifications
    FOR DELETE TO authenticated USING (true);

-- 직원
CREATE POLICY "Authenticated users can view employees" ON employees
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert employees" ON employees
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update employees" ON employees
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete employees" ON employees
    FOR DELETE TO authenticated USING (true);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_invoices_updated_at BEFORE UPDATE ON tax_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_deposits_updated_at BEFORE UPDATE ON bank_deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_tax_invoices_updated_at BEFORE UPDATE ON customer_tax_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_bank_deposits_updated_at BEFORE UPDATE ON customer_bank_deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_deposit_classifications_updated_at BEFORE UPDATE ON bank_deposit_classifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. INITIAL DATA
-- ============================================

-- 초기 데이터 없음
-- 첫 번째 가입자가 자동으로 관리자가 됩니다.

-- 샘플 거래처 데이터 (선택사항)
-- 실제 운영 시에는 주석 처리하거나 삭제하세요
/*
INSERT INTO customers (company_name, business_number, representative_name, phone, customer_type, alias_names) VALUES
    ('한성전기', '123-45-67890', '김대표', '010-1234-5678', 'REGULAR', ARRAY['한성전기', '김대표', 'HANSUNG']),
    ('미래조명', '234-56-78901', '이사장', '010-2345-6789', 'REGULAR', ARRAY['미래조명', '이사장', 'MIRAE']),
    ('대한전력설비', '345-67-89012', '박대표', '010-3456-7890', 'REGULAR', ARRAY['대한전력설비', '박대표', 'DAEHAN'])
ON CONFLICT (business_number) DO NOTHING;
*/

-- ============================================
-- 7. COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE customers IS '거래처 정보';
COMMENT ON TABLE tax_invoices IS '세금계산서';
COMMENT ON TABLE bank_deposits IS '입금내역';
COMMENT ON TABLE customer_tax_invoices IS '거래처-세금계산서 연결 테이블';
COMMENT ON TABLE customer_bank_deposits IS '거래처-입금내역 연결 테이블';
COMMENT ON TABLE bank_deposit_classifications IS '기타입금 분류';
COMMENT ON TABLE employees IS '직원 정보 (첫 번째 가입자는 자동으로 관리자)';

COMMENT ON COLUMN customers.alias_names IS '별칭 목록 (입금자명 매칭용)';
COMMENT ON COLUMN customer_tax_invoices.customer_id IS 'NULL 허용 (매칭 안 된 경우)';
COMMENT ON COLUMN customer_bank_deposits.customer_id IS 'NULL 허용 (매칭 안 된 경우)';
COMMENT ON COLUMN bank_deposit_classifications.classification_type IS 'internal: 내부입금, external: 외부입금';
COMMENT ON COLUMN employees.is_admin IS '관리자 여부 (첫 번째 가입자는 자동으로 true)';

-- ============================================
-- END OF SCHEMA
-- ============================================