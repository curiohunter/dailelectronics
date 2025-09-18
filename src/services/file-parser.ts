import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Database } from '@/types/database.types'

type TaxInvoice = Database['public']['Tables']['tax_invoices']['Insert']
type BankDeposit = Database['public']['Tables']['bank_deposits']['Insert']
type Customer = Database['public']['Tables']['customers']['Insert']

interface TaxInvoiceRow {
  작성일자?: string | number
  승인번호?: string
  발급일자?: string | number
  전송일자?: string | number
  공급자사업자등록번호?: string
  상호?: string
  대표자명?: string
  주소?: string
  공급받는자사업자등록번호?: string
  합계금액?: string | number
  공급가액?: string | number
  세액?: string | number
  '영수/청구 구분'?: string
  '공급자 이메일'?: string
  '공급받는자 이메일1'?: string
  품목일자?: string | number
  품목명?: string
  품목규격?: string
  품목수량?: string | number
  품목단가?: string | number
  품목공급가액?: string | number
  품목세액?: string | number
  품목비고?: string
}

interface BankDepositRow {
  거래일자?: string | number
  거래시간?: string
  적요?: string
  '출금(원)'?: string | number
  '입금(원)'?: string | number
  내용?: string
  '잔액(원)'?: string | number
  거래점?: string
}

export class FileParser {
  // 파일 확장자에 따라 적절한 파서 선택
  static async parseFile(file: File): Promise<any> {
    // Ensure we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('FileParser는 서버 사이드에서만 실행되어야 합니다.')
    }
    
    const fileName = file.name.toLowerCase()
    
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return this.parseExcelFile(file)
    } else if (fileName.endsWith('.csv')) {
      return this.parseCSVFile(file)
    } else {
      throw new Error('지원하지 않는 파일 형식입니다. XLS, XLSX, CSV 파일만 지원합니다.')
    }
  }
  
  // Excel 파일 파싱 (XLS/XLSX)
  private static async parseExcelFile(file: File): Promise<any[]> {
    try {
      // Server-side: Convert File to Buffer
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
          
          // 첫 번째 시트 선택
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // 실제 데이터 범위 확인
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
          console.log('Excel 범위:', range)
          
          // 파일 타입 구분 - 첫 번째 셀의 내용으로 판단
          let isBankFile = false
          const firstCell = worksheet['A1']
          if (firstCell && firstCell.v) {
            const firstCellValue = String(firstCell.v)
            isBankFile = firstCellValue.includes('거래내역') || firstCellValue.includes('계좌')
          }
          
          // 파일명으로도 체크 (fallback)
          const fileName = file.name || ''
          if (!isBankFile) {
            // 파일명에서 은행 관련 키워드 찾기
            isBankFile = /은행|거래|bank|deposit/i.test(fileName)
          }
          
          console.log('파일 타입 감지:', { fileName, isBankFile, firstCell: firstCell?.v })
          
          // 헤더가 있는 행을 찾기
          let headerRow = 5 // 기본값: 0-based, 실제로는 6번째 행
          let jsonData: any[] = []
          
          // 헤더 행을 찾기 (세금계산서는 '승인번호', 은행거래는 '거래일자'로 찾기)
          for (let row = 0; row <= Math.min(10, range.e.r); row++) {
            // 각 열의 첫 번째 셀 확인
            let foundHeader = false
            for (let col = 0; col <= Math.min(10, range.e.c); col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
              const cell = worksheet[cellAddress]
              if (cell && cell.v) {
                const cellValue = String(cell.v)
                console.log(`셀 [${row}, ${col}] 값:`, cellValue)
                if ((isBankFile && cellValue === '거래일자') || 
                    (!isBankFile && cellValue === '승인번호')) {
                  headerRow = row
                  console.log('헤더 행 발견:', row + 1, isBankFile ? '(은행 파일)' : '(세금계산서)')
                  foundHeader = true
                  break
                }
              }
            }
            // 헤더를 찾았으면 루프 종료
            if (foundHeader) break
          }
          
          // 헤더 행부터 데이터 파싱
          jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            dateNF: 'yyyy-mm-dd',
            defval: '',
            range: headerRow // 헤더 행부터 시작
          })
          
          console.log('Excel 파싱 결과:', jsonData.length, '개 행')
          if (jsonData.length > 0) {
            console.log('첫 번째 행 샘플:', Object.keys(jsonData[0]))
          }
          
      return jsonData
    } catch (error) {
      console.error('Excel 파싱 오류:', error)
      throw error
    }
  }
  
  // CSV 파일 파싱
  private static async parseCSVFile(file: File): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Server-side: Convert File to text
        const text = await file.text()
        const lines = text.split('\n')
        
        // 파일 타입 구분
        const fileName = file.name || ''
        // 파일 내용에서 은행 관련 키워드 찾기
        const isBankFile = text.includes('거래내역') || text.includes('거래일자') || 
                          /은행|거래|bank|deposit/i.test(fileName)
        
        // 실제 헤더가 있는 행 찾기
        let headerLineIndex = 5 // 0-based index
        let dataStartIndex = 6
        
        // 헤더 행 찾기 (세금계산서는 '승인번호', 은행거래는 '거래일자'로 찾기)
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          if ((isBankFile && lines[i].includes('거래일자') && lines[i].includes('거래시간')) ||
              (!isBankFile && lines[i].includes('승인번호') && lines[i].includes('발급일자'))) {
            headerLineIndex = i
            dataStartIndex = i + 1
            break
          }
        }
        
        // 헤더와 데이터 행만 추출
        const headerLine = lines[headerLineIndex]
        const dataLines = lines.slice(dataStartIndex).filter(line => line.trim() !== '')
        const csvContent = [headerLine, ...dataLines].join('\n')
        
        // Papa Parse로 파싱
        Papa.parse(csvContent, {
          header: true,
          encoding: 'UTF-8',
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV 파싱 완료:', results.data.length, '개 행')
            resolve(results.data)
          },
          error: (error: any) => {
            console.error('CSV 파싱 오류:', error)
            reject(error)
          }
        })
      } catch (error) {
        console.error('CSV 파일 읽기 오류:', error)
        reject(error)
      }
    })
  }
  
  // 세금계산서 파일 파싱 (XLS/XLSX/CSV)
  static async parseTaxInvoiceFile(file: File): Promise<{ invoices: TaxInvoice[], customers: Customer[] }> {
    const data = await this.parseFile(file)
    const invoices: TaxInvoice[] = []
    const customersMap = new Map<string, Customer>()
    
    console.log('파싱된 데이터 개수:', data.length)
    
    // 데이터가 있는 경우 첫 번째 행의 키 확인
    if (data.length > 0) {
      console.log('첫 번째 행의 키:', Object.keys(data[0]))
      console.log('첫 번째 행 데이터:', data[0])
    }
    
    data.forEach((row: any) => {
      // 다양한 키 형식 처리 (엑셀에서 공백이나 특수문자가 있을 수 있음)
      const approval = row['승인번호'] || row['승인 번호'] || row['ApprovalNumber']
      const issueDateRaw = row['발급일자'] || row['발급 일자'] || row['IssueDate']
      
      // 데이터가 있는 행만 처리
      if (!approval || !issueDateRaw) {
        return
      }
      
      // 빈 값이나 헤더 행 제외
      if (approval === '승인번호' || approval === '' || approval === 'ApprovalNumber') {
        return
      }
      
      // Excel에서 중복 컬럼명이 _1 접미사로 변경되는 것 처리
      // 공급자 정보 (첫 번째 상호, 대표자명, 주소)
      const supplierCompany = row['상호']
      const supplierRep = row['대표자명']
      const supplierAddr = row['주소']
      
      // 공급받는자 정보 (_1 접미사가 붙은 컬럼)
      const buyerCompany = row['상호_1'] || row['상호.1'] || row['상호']
      const buyerRep = row['대표자명_1'] || row['대표자명.1'] || row['대표자명']
      const buyerAddr = row['주소_1'] || row['주소.1'] || row['주소']
      
      console.log('처리 중인 행:', { approval, issueDateRaw })
      console.log('공급자/공급받는자 정보:', {
        supplier: supplierCompany,
        buyer: buyerCompany,
        buyerKeys: Object.keys(row).filter(k => k.includes('상호'))
      })
      
      // 금액 파싱
      const totalAmount = this.parseAmount(row.합계금액)
      const supplyAmount = this.parseAmount(row.공급가액)
      const taxAmount = this.parseAmount(row.세액)
      
      // 날짜 파싱
      const issueDate = this.parseDate(row.발급일자)
      const creationDate = this.parseDate(row.작성일자)
      const transmissionDate = this.parseDate(row.전송일자)
      const itemDate = this.parseDate(row.품목일자)
      
      // 영수/청구 구분 파싱
      const transactionType = row['영수/청구 구분'] === '영수' ? 'RECEIPT' : 'BILL'
      
      // 고객 정보 저장 (공급받는자가 고객)
      if (row.공급받는자사업자등록번호 && buyerCompany) {
        const customerKey = row.공급받는자사업자등록번호
        if (!customersMap.has(customerKey)) {
          customersMap.set(customerKey, {
            business_number: row.공급받는자사업자등록번호,
            company_name: buyerCompany,  // 공급받는자 상호
            representative_name: buyerRep,  // 공급받는자 대표자명
            address: buyerAddr,  // 공급받는자 주소
            email: row['공급받는자 이메일1'],
            customer_type: 'REGULAR'
          })
        }
      }
      
      const invoice: TaxInvoice = {
        approval_number: row.승인번호,
        issue_date: issueDate,
        creation_date: creationDate,
        transmission_date: transmissionDate,
        
        supplier_business_number: row.공급자사업자등록번호,
        supplier_company_name: supplierCompany,  // 공급자 상호 (다일전기)
        supplier_representative: supplierRep,  // 공급자 대표자명
        supplier_address: supplierAddr,  // 공급자 주소
        supplier_email: row['공급자 이메일'],
        
        buyer_business_number: row.공급받는자사업자등록번호,
        buyer_company_name: buyerCompany,  // 공급받는자 상호 (동현전기 등)
        buyer_representative: buyerRep,  // 공급받는자 대표자명
        buyer_address: buyerAddr,  // 공급받는자 주소
        buyer_email: row['공급받는자 이메일1'],
        
        total_amount: totalAmount,
        supply_amount: supplyAmount,
        tax_amount: taxAmount,
        
        transaction_type: transactionType,
        
        item_date: itemDate,
        item_name: row.품목명,
        item_specification: row.품목규격,
        item_quantity: this.parseAmount(row.품목수량),
        item_unit_price: this.parseAmount(row.품목단가),
        item_supply_amount: this.parseAmount(row.품목공급가액),
        item_tax_amount: this.parseAmount(row.품목세액),
        item_remarks: row.품목비고
      }
      
      invoices.push(invoice)
    })
    
    return {
      invoices,
      customers: Array.from(customersMap.values())
    }
  }
  
  // 은행 거래내역 파일 파싱 (XLS/XLSX/CSV)
  static async parseBankDepositFile(file: File): Promise<BankDeposit[]> {
    const data = await this.parseFile(file)
    const deposits: BankDeposit[] = []
    
    console.log('은행 거래내역 파싱 시작:', data.length, '개 행')
    if (data.length > 0) {
      console.log('첫 번째 행 키:', Object.keys(data[0]))
      console.log('첫 번째 행 데이터:', data[0])
    }
    
    data.forEach((row: BankDepositRow) => {
      // 데이터가 있는 행만 처리
      if (!row.거래일자) return
      
      // 입금만 처리 (출금은 제외)
      const depositAmount = this.parseAmount(row['입금(원)'])
      if (depositAmount <= 0) return
      
      const deposit: BankDeposit = {
        transaction_date: this.parseDate(row.거래일자),
        transaction_time: row.거래시간,
        transaction_type: row.적요,
        deposit_amount: depositAmount,
        withdrawal_amount: this.parseAmount(row['출금(원)']),
        deposit_name: row.내용,
        balance: this.parseAmount(row['잔액(원)']),
        branch_name: row.거래점
      }
      
      deposits.push(deposit)
    })
    
    return deposits
  }
  
  // 금액 파싱 헬퍼
  private static parseAmount(value?: string | number): number {
    if (!value) return 0
    
    // 이미 숫자인 경우
    if (typeof value === 'number') return value
    
    // 문자열인 경우 쉼표 제거하고 숫자로 변환
    const cleaned = value.toString().replace(/[,\s]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  
  // 날짜 파싱 헬퍼
  private static parseDate(value?: string | number): string {
    if (!value) return new Date().toISOString().split('T')[0]
    
    // Excel에서 날짜가 숫자로 오는 경우 (Excel date serial number)
    if (typeof value === 'number') {
      const excelDate = XLSX.SSF.parse_date_code(value)
      const year = excelDate.y
      const month = String(excelDate.m).padStart(2, '0')
      const day = String(excelDate.d).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // 문자열 날짜 처리
    const dateStr = value.toString()
    
    // 다양한 날짜 형식 처리
    // 2025-08-21, 2025/08/21, 8/16/25, 2025.08.21 등
    const parts = dateStr.split(/[-\/\.]/)
    
    if (parts.length === 3) {
      let year = parts[0]
      let month = parts[1]
      let day = parts[2]
      
      // 월/일/년 형식 처리 (미국식)
      if (parts[0].length <= 2 && parseInt(parts[2]) > 31) {
        month = parts[0]
        day = parts[1]
        year = parts[2]
      }
      
      // 2자리 연도를 4자리로 변환
      if (year.length === 2) {
        year = '20' + year
      }
      
      // 월과 일을 2자리로 패딩
      month = month.padStart(2, '0')
      day = day.padStart(2, '0')
      
      return `${year}-${month}-${day}`
    }
    
    return new Date().toISOString().split('T')[0]
  }
}