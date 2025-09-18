export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          business_number: string | null
          company_name: string
          representative_name: string | null
          address: string | null
          email: string | null
          phone: string | null
          customer_type: string | null
          alias_names: string[] | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_number?: string | null
          company_name: string
          representative_name?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          customer_type?: string | null
          alias_names?: string[] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_number?: string | null
          company_name?: string
          representative_name?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          customer_type?: string | null
          alias_names?: string[] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tax_invoices: {
        Row: {
          id: string
          approval_number: string | null
          issue_date: string
          creation_date: string | null
          transmission_date: string | null
          supplier_business_number: string | null
          supplier_company_name: string | null
          supplier_representative: string | null
          supplier_address: string | null
          supplier_email: string | null
          buyer_business_number: string | null
          buyer_company_name: string | null
          buyer_representative: string | null
          buyer_address: string | null
          buyer_email: string | null
          total_amount: number
          supply_amount: number
          tax_amount: number
          invoice_type: string | null
          invoice_category: string | null
          issue_type: string | null
          transaction_type: string
          item_date: string | null
          item_name: string | null
          item_specification: string | null
          item_quantity: number | null
          item_unit_price: number | null
          item_supply_amount: number | null
          item_tax_amount: number | null
          item_remarks: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          approval_number?: string | null
          issue_date: string
          creation_date?: string | null
          transmission_date?: string | null
          supplier_business_number?: string | null
          supplier_company_name?: string | null
          supplier_representative?: string | null
          supplier_address?: string | null
          supplier_email?: string | null
          buyer_business_number?: string | null
          buyer_company_name?: string | null
          buyer_representative?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          total_amount: number
          supply_amount: number
          tax_amount: number
          invoice_type?: string | null
          invoice_category?: string | null
          issue_type?: string | null
          transaction_type: string
          item_date?: string | null
          item_name?: string | null
          item_specification?: string | null
          item_quantity?: number | null
          item_unit_price?: number | null
          item_supply_amount?: number | null
          item_tax_amount?: number | null
          item_remarks?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          approval_number?: string | null
          issue_date?: string
          creation_date?: string | null
          transmission_date?: string | null
          supplier_business_number?: string | null
          supplier_company_name?: string | null
          supplier_representative?: string | null
          supplier_address?: string | null
          supplier_email?: string | null
          buyer_business_number?: string | null
          buyer_company_name?: string | null
          buyer_representative?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          total_amount?: number
          supply_amount?: number
          tax_amount?: number
          invoice_type?: string | null
          invoice_category?: string | null
          issue_type?: string | null
          transaction_type?: string
          item_date?: string | null
          item_name?: string | null
          item_specification?: string | null
          item_quantity?: number | null
          item_unit_price?: number | null
          item_supply_amount?: number | null
          item_tax_amount?: number | null
          item_remarks?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      bank_deposits: {
        Row: {
          id: string
          transaction_date: string
          transaction_time: string | null
          transaction_type: string | null
          deposit_amount: number
          withdrawal_amount: number | null
          deposit_name: string | null
          balance: number | null
          branch_name: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          transaction_date: string
          transaction_time?: string | null
          transaction_type?: string | null
          deposit_amount: number
          withdrawal_amount?: number | null
          deposit_name?: string | null
          balance?: number | null
          branch_name?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          transaction_date?: string
          transaction_time?: string | null
          transaction_type?: string | null
          deposit_amount?: number
          withdrawal_amount?: number | null
          deposit_name?: string | null
          balance?: number | null
          branch_name?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customer_tax_invoices: {
        Row: {
          id: string
          customer_id: string | null
          tax_invoice_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          tax_invoice_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          tax_invoice_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customer_bank_deposits: {
        Row: {
          id: string
          customer_id: string | null
          bank_deposit_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          bank_deposit_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          bank_deposit_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      bank_deposit_classifications: {
        Row: {
          id: string
          bank_deposit_id: string
          classification_type: 'internal' | 'external'
          classification_detail: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bank_deposit_id: string
          classification_type: 'internal' | 'external'
          classification_detail?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bank_deposit_id?: string
          classification_type?: 'internal' | 'external'
          classification_detail?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          auth_user_id: string | null
          invite_code: string | null
          invite_code_expires_at: string | null
          invite_code_used_at: string | null
          is_admin: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          auth_user_id?: string | null
          invite_code?: string | null
          invite_code_expires_at?: string | null
          invite_code_used_at?: string | null
          is_admin?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          auth_user_id?: string | null
          invite_code?: string | null
          invite_code_expires_at?: string | null
          invite_code_used_at?: string | null
          is_admin?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      daily_issue_ledger: {
        Row: {
          amount_match_status: string | null
          company_name: string | null
          deposit_amount: number | null
          deposit_date: string | null
          invoice_amount: number | null
          invoice_id: string | null
          issue_date: string | null
          issue_day: number | null
          issue_month: number | null
          issue_year: number | null
          notes: string | null
          remaining_amount: number | null
          transaction_type: string | null
        }
      }
      month_end_ledger: {
        Row: {
          company_name: string | null
          invoice_amount: number | null
          invoice_id: string | null
          issue_date: string | null
          issue_day: number | null
          issue_month: number | null
          issue_year: number | null
          last_deposit_date: string | null
          notes: string | null
          remaining_amount: number | null
          total_deposit_amount: number | null
          transaction_type: string | null
        }
      }
      special_payment_ledger: {
        Row: {
          balance: number | null
          company_name: string | null
          invoice_amount: number | null
          invoice_id: string | null
          issue_date: string | null
          issue_day: number | null
          issue_month: number | null
          issue_year: number | null
          last_deposit_date: string | null
          notes: string | null
          total_deposit_amount: number | null
          transaction_type: string | null
        }
      }
    }
  }
}