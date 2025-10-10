import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to fetch all rows with pagination
async function fetchAllRows<T>(
  supabase: any,
  tableName: string,
  selectQuery: string,
  orderBy?: { column: string; ascending: boolean }
): Promise<T[]> {
  let allData: T[] = []
  let from = 0
  const pageSize = 1000
  let hasMore = true

  console.log(`📥 Fetching all rows from ${tableName}...`)

  while (hasMore) {
    let query = supabase
      .from(tableName)
      .select(selectQuery)
      .range(from, from + pageSize - 1)

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending })
    }

    const { data, error } = await query

    if (error) {
      console.error(`❌ Error fetching ${tableName}:`, error)
      throw error
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data]
      from += pageSize
      hasMore = data.length === pageSize
      console.log(`  ✓ Loaded ${allData.length} rows from ${tableName}`)
    } else {
      hasMore = false
    }
  }

  console.log(`✅ Completed ${tableName}: ${allData.length} total rows`)
  return allData
}

export async function GET() {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    console.log('🚀 Starting server-side data fetch...')

    // Fetch all data with pagination in parallel
    const [
      customersData,
      invoicesData,
      depositsData,
      invoiceRelationsData,
      depositRelationsData
    ] = await Promise.all([
      fetchAllRows(supabase, 'customers', '*', { column: 'created_at', ascending: false }),
      fetchAllRows(supabase, 'tax_invoices', '*', { column: 'issue_date', ascending: false }),
      fetchAllRows(supabase, 'bank_deposits', '*', { column: 'transaction_date', ascending: false }),
      fetchAllRows(supabase, 'customer_tax_invoices', 'id, customer_id, tax_invoice_id, created_at, updated_at, customer:customers(*)'),
      fetchAllRows(supabase, 'customer_bank_deposits', 'id, customer_id, bank_deposit_id, created_at, updated_at, customer:customers(*)')
    ])

    // Fetch classifications separately with error handling
    let depositClassificationsData: any[] = []
    try {
      depositClassificationsData = await fetchAllRows(
        supabase,
        'bank_deposit_classifications',
        '*, deposit:bank_deposits(transaction_date, transaction_time, deposit_name, deposit_amount)'
      )
    } catch (error) {
      console.log('⚠️ Classifications fetch skipped:', error)
    }

    // Process tax invoices with relationship status on server side
    const processedInvoices = invoicesData.map((invoice: any) => {
      const relation = invoiceRelationsData.find((rel: any) => rel.tax_invoice_id === invoice.id) as any

      // Find customer from relations or from customers array
      let relatedCustomer = relation?.customer || null
      if (relation?.customer_id && !relatedCustomer) {
        relatedCustomer = customersData.find((c: any) => c.id === relation.customer_id) || null
      }

      return {
        ...invoice,
        hasRelation: !!relation && !!relation.customer_id,
        relatedCustomer: relatedCustomer
      }
    })

    // Process bank deposits with relationship status and classifications
    const processedDeposits = depositsData.map((deposit: any) => {
      const relation = depositRelationsData.find((rel: any) => rel.bank_deposit_id === deposit.id) as any
      const classification = depositClassificationsData.find((cls: any) => cls.bank_deposit_id === deposit.id)

      // Find customer from relations or from customers array
      let relatedCustomer = relation?.customer || null
      if (relation?.customer_id && !relatedCustomer) {
        relatedCustomer = customersData.find((c: any) => c.id === relation.customer_id) || null
      }

      return {
        ...deposit,
        hasRelation: !!relation && !!relation.customer_id,
        relatedCustomer: relatedCustomer,
        classification: classification ? {
          classification_type: classification.classification_type,
          classification_detail: classification.classification_detail
        } : null
      }
    })

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Server-side processing completed in ${duration}s`)
    console.log(`📊 Data summary:`, {
      customers: customersData.length,
      invoices: processedInvoices.length,
      deposits: processedDeposits.length,
      invoiceRelations: invoiceRelationsData.length,
      depositRelations: depositRelationsData.length,
      classifications: depositClassificationsData.length
    })

    return NextResponse.json({
      success: true,
      data: {
        customers: customersData,
        taxInvoices: processedInvoices,
        bankDeposits: processedDeposits,
        invoiceRelations: invoiceRelationsData,
        depositRelations: depositRelationsData,
        otherDeposits: depositClassificationsData
      },
      meta: {
        duration: `${duration}s`,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Server-side data fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
