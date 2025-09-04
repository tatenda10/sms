import React from 'react';
import StudentFinancialRecordComponent from './components/StudentFinancialRecord';

const StudentFinancialRecord = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Financial Record</h1>
            <p className="text-xs text-gray-600">View and manage student financial statements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Financial Record Component - Full Width */}
          <div>
            <StudentFinancialRecordComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFinancialRecord;
