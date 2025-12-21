import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Fetch all staff with banking details
    const { data: staff, error } = await supabaseServer
      .from("staff")
      .select(`
        id, 
        name, 
        phone, 
        email, 
        department, 
        salary, 
        total_salary,
        joined_at, 
        address, 
        upi_id,
        account_number,
        ifsc_code,
        bank_name,
        employee_id,
        designation,
        status,
        created_at
      `)
      .order("name", { ascending: true });

    if (error) {
      console.error("❌ Staff Export Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format data for Excel
    const formattedData = (staff || []).map((employee: any) => ({
      'Employee ID': employee.employee_id || 'N/A',
      'Name': employee.name,
      'Phone': employee.phone || 'N/A',
      'Email': employee.email || 'N/A',
      'Department': employee.department || 'Not Assigned',
      'Designation': employee.designation || 'N/A',
      'Status': employee.status || 'active',
      'Basic Salary': employee.salary ? `₹${employee.salary.toLocaleString('en-IN')}` : '₹0',
      'Total Salary': employee.total_salary ? `₹${employee.total_salary.toLocaleString('en-IN')}` : 
                     employee.salary ? `₹${employee.salary.toLocaleString('en-IN')}` : '₹0',
      'Bank Name': employee.bank_name || 'N/A',
      'Account Number': employee.account_number || 'N/A',
      'IFSC Code': employee.ifsc_code || 'N/A',
      'UPI ID': employee.upi_id || 'N/A',
      'Joined Date': employee.joined_at 
        ? new Date(employee.joined_at).toLocaleDateString('en-IN')
        : 'N/A',
      'Address': employee.address || 'N/A',
      'Created Date': employee.created_at 
        ? new Date(employee.created_at).toLocaleDateString('en-IN')
        : 'N/A'
    }));

    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Add column widths for better formatting
    const colWidths = [
      { wch: 15 }, // Employee ID
      { wch: 25 }, // Name
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 20 }, // Department
      { wch: 20 }, // Designation
      { wch: 12 }, // Status
      { wch: 15 }, // Basic Salary
      { wch: 15 }, // Total Salary
      { wch: 20 }, // Bank Name
      { wch: 20 }, // Account Number
      { wch: 15 }, // IFSC Code
      { wch: 25 }, // UPI ID
      { wch: 15 }, // Joined Date
      { wch: 40 }, // Address
      { wch: 15 }  // Created Date
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    
    // Add summary sheet
    const summaryData = [
      ['HR Management System - Staff Export'],
      ['Export Date', new Date().toLocaleDateString('en-IN')],
      ['Total Employees', staff?.length || 0],
      ['Active Employees', staff?.filter((s: any) => s.status === 'active').length || 0],
      [''],
      ['Department Summary']
    ];

    // Add department breakdown
    const deptCount: Record<string, number> = {};
    staff?.forEach((emp: any) => {
      const dept = emp.department || 'Unassigned';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    Object.entries(deptCount).forEach(([dept, count]) => {
      summaryData.push([dept, count]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
      type: 'buffer'
    });
    
    const filename = `staff_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err: any) {
    console.error('❌ Export error:', err);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}