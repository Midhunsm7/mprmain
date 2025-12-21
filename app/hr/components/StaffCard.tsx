"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  DollarSign, 
  Calendar, 
  Eye,
  Upload,
  Edit,
  CreditCard,
  Banknote,
  MapPin,
  BadgeCheck,
  Clock
} from "lucide-react";

interface StaffCardProps {
  staff: any;
  onViewAttendance: () => void;
  onUploadDocs: () => void;
  onEditSalary: () => void;
  onEditBanking: () => void;
  onEdit: () => void;
}

export function StaffCard({ 
  staff, 
  onViewAttendance, 
  onUploadDocs, 
  onEditSalary,
  onEditBanking,
  onEdit 
}: StaffCardProps) {
  const hasBankingDetails = staff.account_number || staff.upi_id;
  const hasDocuments = staff.aadhaar_url || staff.pan_url || (staff.documents && staff.documents.length > 0);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Left Section - Employee Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-xl">
                <User className="h-6 w-6 text-slate-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {staff.name}
                  </h3>
                  <Badge 
                    variant={staff.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {staff.status || 'active'}
                  </Badge>
                  {staff.employee_id && (
                    <span className="text-sm text-slate-500 font-mono">
                      {staff.employee_id}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{staff.phone || 'Not provided'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{staff.email || 'Not provided'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="h-3.5 w-3.5" />
                    <span>{staff.department || 'Unassigned'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>₹{(staff.total_salary || staff.salary || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                {/* Banking Details Summary */}
                {hasBankingDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <BadgeCheck className="h-3 w-3" />
                        <span>Banking Details Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {staff.upi_id && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            UPI: {staff.upi_id}
                          </Badge>
                        )}
                        {staff.bank_name && (
                          <Badge variant="outline" className="text-xs bg-emerald-50">
                            {staff.bank_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onViewAttendance}
                className="flex items-center gap-2"
              >
                <Eye className="h-3.5 w-3.5" />
                Attendance
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={hasBankingDetails ? "outline" : "default"}
                onClick={onEditBanking}
                className={`flex items-center gap-2 ${hasBankingDetails ? '' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Banknote className="h-3.5 w-3.5" />
                {hasBankingDetails ? 'Banking' : 'Add Banking'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onEditSalary}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Salary
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onUploadDocs}
                className="flex items-center gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                Docs
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}