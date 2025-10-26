# Attendance System Backend

## Overview
Complete backend implementation for the school attendance management system with present/absent tracking.

## Database Structure

### Tables Created
1. **attendance_records** - Main attendance data
2. **attendance_settings** - Class-specific attendance rules

### Migration
- File: `migrations/2024-01-15-create-attendance-tables.sql`
- Run with: `node run-attendance-migration.js`

## API Endpoints

### Employee Attendance Endpoints
Base URL: `/api/employee-attendance`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/mark` | Mark attendance for a class | Employee |
| GET | `/class/:classId/date/:date` | Get attendance for specific date | Employee |
| GET | `/class/:classId/history` | Get attendance history | Employee |
| GET | `/class/:classId/stats` | Get attendance statistics | Employee |
| PUT | `/record/:recordId` | Update attendance record | Employee |
| GET | `/student/:studentId/history` | Get student attendance history | Employee |

### Admin Attendance Endpoints
Base URL: `/api/attendance`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/records` | Get all attendance records with filters | Admin |
| GET | `/stats` | Get attendance statistics dashboard | Admin |
| GET | `/reports` | Generate attendance reports | Admin |
| GET | `/settings/:classId` | Get attendance settings | Admin |
| PUT | `/settings/:classId` | Update attendance settings | Admin |

## Key Features

### Employee Features
- Mark daily attendance for assigned classes
- View attendance history and statistics
- Update existing attendance records
- Track student attendance patterns

### Admin Features
- View all attendance records across classes
- Generate comprehensive reports (date-wise, student-wise, class-wise)
- Configure attendance settings per class
- Export reports to CSV format

### Data Validation
- Prevents duplicate attendance for same student/date
- Validates teacher access to classes
- Ensures data integrity with foreign key constraints
- Date validation (no future dates)

### Security
- Employee authentication required for all employee endpoints
- Admin authentication required for admin endpoints
- Class access validation for teachers
- Input validation and sanitization

## Usage Examples

### Mark Attendance (Employee)
```javascript
POST /api/employee-attendance/mark
{
  "class_id": 1,
  "date": "2024-01-15",
  "records": [
    { "student_id": "STU001", "status": "present", "notes": "On time" },
    { "student_id": "STU002", "status": "absent", "notes": "Sick leave" }
  ]
}
```

### Get Attendance Statistics (Admin)
```javascript
GET /api/attendance/stats?class_id=1&start_date=2024-01-01&end_date=2024-01-31
```

### Generate Report (Admin)
```javascript
GET /api/attendance/reports?start_date=2024-01-01&end_date=2024-01-31&group_by=student&format=csv
```

## Testing

### Run Migration
```bash
cd server
node run-attendance-migration.js
```

### Test Endpoints
```bash
cd server
node test-attendance-endpoints.js
```

## Models

### AttendanceRecord
- `id` (Primary Key)
- `class_id` (Foreign Key to gradelevel_classes)
- `student_id` (Foreign Key to students.RegNumber)
- `attendance_date` (Date)
- `status` (ENUM: 'present', 'absent')
- `marked_by` (Foreign Key to employees)
- `notes` (Text, optional)
- `created_at`, `updated_at` (Timestamps)

### AttendanceSettings
- `id` (Primary Key)
- `class_id` (Foreign Key to gradelevel_classes)
- `auto_mark_absent_after_hours` (Integer, default: 2)
- `require_excuse_for_absence` (Boolean, default: true)
- `send_absence_notifications` (Boolean, default: true)
- `created_at`, `updated_at` (Timestamps)

## Error Handling

All endpoints return consistent JSON responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Next Steps

1. Run the migration to create database tables
2. Test the endpoints with the provided test script
3. Integrate with frontend attendance components
4. Add real-time notifications for attendance alerts
5. Implement automated absence reporting

## Files Created

- `migrations/2024-01-15-create-attendance-tables.sql`
- `models/AttendanceRecord.js`
- `models/AttendanceSettings.js`
- `controllers/attendance/employeeAttendanceController.js`
- `controllers/attendance/adminAttendanceController.js`
- `routes/attendance/employeeAttendance.js`
- `routes/attendance/adminAttendance.js`
- `run-attendance-migration.js`
- `test-attendance-endpoints.js`
