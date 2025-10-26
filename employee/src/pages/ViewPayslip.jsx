import { useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

const ViewPayslip = () => {
  const { id } = useParams();

  // Mock payslip data
  const payslip = {
    id: id,
    month: 'December 2024',
    employee: {
      name: 'John Doe',
      id: 'EMP0001',
      department: 'IT Department'
    },
    earnings: {
      basicSalary: 2000.00,
      allowances: 300.00,
      overtime: 200.00,
      total: 2500.00
    },
    deductions: {
      tax: 250.00,
      insurance: 100.00,
      other: 50.00,
      total: 400.00
    },
    netPay: 2100.00,
    date: '2024-12-31'
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/payslips"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Payslips
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payslip - {payslip.month}</h1>
            <p className="text-gray-600">Employee ID: {payslip.employee.id}</p>
          </div>
          <div className="flex space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Payslip Content */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Company Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">School Management System</h2>
            <p className="text-gray-600">Employee Payslip</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
              <p className="text-sm text-gray-600">Name: {payslip.employee.name}</p>
              <p className="text-sm text-gray-600">ID: {payslip.employee.id}</p>
              <p className="text-sm text-gray-600">Department: {payslip.employee.department}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pay Period</h3>
              <p className="text-sm text-gray-600">Month: {payslip.month}</p>
              <p className="text-sm text-gray-600">Date: {new Date(payslip.date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Earnings and Deductions */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Earnings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Basic Salary</span>
                  <span className="text-sm font-medium">${payslip.earnings.basicSalary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Allowances</span>
                  <span className="text-sm font-medium">${payslip.earnings.allowances.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overtime</span>
                  <span className="text-sm font-medium">${payslip.earnings.overtime.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Total Earnings</span>
                  <span className="text-sm font-bold">${payslip.earnings.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deductions</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-medium">${payslip.deductions.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Insurance</span>
                  <span className="text-sm font-medium">${payslip.deductions.insurance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Other</span>
                  <span className="text-sm font-medium">${payslip.deductions.other.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Total Deductions</span>
                  <span className="text-sm font-bold">${payslip.deductions.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Net Pay</span>
              <span className="text-2xl font-bold text-green-600">${payslip.netPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPayslip;
