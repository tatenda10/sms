# 📅 Timetable Management System

## Overview
A comprehensive timetable management system that supports day-specific periods, special events (Assembly, Sports, Chapel), and automatic conflict detection to prevent teacher overlaps.

## 🗄️ Database Structure

### Core Tables
- **`period_templates`** - Main timetable configurations (Term 1 2025, etc.)
- **`period_template_days`** - Day-specific configurations within templates
- **`periods`** - Individual time periods for each day
- **`timetable_entries`** - Actual class assignments
- **`timetable_generation_logs`** - Track generation history
- **`timetable_conflicts`** - Conflict detection and resolution

### Key Features
- **Day-Specific Periods**: Different schedules for different days
- **Special Periods**: Assembly (Monday), Sports (Wednesday), Chapel (Friday)
- **Break Management**: Automatic exclusion of break periods from class assignments
- **Teacher Conflict Prevention**: One teacher = One period per day
- **Flexible Generation**: Auto-generation with conflict detection

## 🚀 API Endpoints

### Template Management
```
GET    /api/timetables/templates                    # Get all templates
GET    /api/timetables/templates/:id               # Get template details
POST   /api/timetables/templates                   # Create template
PUT    /api/timetables/templates/:id               # Update template
```

### Period Management
```
GET    /api/timetables/templates/:id/periods/:day  # Get periods for day
POST   /api/timetables/templates/:id/periods/:day  # Create period
PUT    /api/timetables/periods/:id                 # Update period
DELETE /api/timetables/periods/:id                 # Delete period
```

### Timetable Entries
```
GET    /api/timetables/templates/:id/entries       # Get timetable entries
POST   /api/timetables/templates/:id/entries       # Create entry
PUT    /api/timetables/entries/:id                 # Update entry
DELETE /api/timetables/entries/:id                 # Delete entry
```

### Generation & Analysis
```
POST   /api/timetable-generation/templates/:id/generate    # Auto-generate
GET    /api/timetable-generation/templates/:id/conflicts   # Detect conflicts
PUT    /api/timetable-generation/conflicts/:id/resolve     # Resolve conflict
GET    /api/timetable-generation/templates/:id/stats       # Get statistics
GET    /api/timetable-generation/templates/:id/history     # Generation history
```

### Helper Endpoints
```
GET    /api/timetables/templates/:id/available-subject-classes  # Available classes
GET    /api/timetables/templates/:id/availability/:day/:period  # Teacher availability
```

## 📋 Sample Day Configurations

### Monday (with Assembly)
```
Assembly: 8:00-8:30 (Break period)
Period 1: 8:30-9:10 (Teaching)
Period 2: 9:10-9:50 (Teaching)
Break: 9:50-10:05 (Break)
Period 3: 10:05-10:45 (Teaching)
Period 4: 10:45-11:25 (Teaching)
Break: 11:25-11:40 (Break)
Period 5: 11:40-12:20 (Teaching)
Period 6: 12:20-1:00 (Teaching)
Lunch: 1:00-2:00 (Break)
Period 7: 2:00-2:40 (Teaching)
Period 8: 2:40-3:20 (Teaching)
```

### Wednesday (with Sports)
```
Period 1: 8:00-8:40 (Teaching)
Period 2: 8:40-9:20 (Teaching)
Break: 9:20-9:35 (Break)
Period 3: 9:35-10:15 (Teaching)
Period 4: 10:15-10:55 (Teaching)
Break: 10:55-11:10 (Break)
Period 5: 11:10-11:50 (Teaching)
Period 6: 11:50-12:30 (Teaching)
Lunch: 12:30-1:30 (Break)
Sports: 1:30-2:30 (Break)
Period 7: 2:30-3:10 (Teaching)
Period 8: 3:10-3:50 (Teaching)
```

### Friday (with Chapel)
```
Chapel: 8:00-8:30 (Break)
Period 1: 8:30-9:10 (Teaching)
Period 2: 9:10-9:50 (Teaching)
Break: 9:50-10:05 (Break)
Period 3: 10:05-10:45 (Teaching)
Period 4: 10:45-11:25 (Teaching)
Break: 11:25-11:40 (Break)
Period 5: 11:40-12:20 (Teaching)
Period 6: 12:20-1:00 (Teaching)
Lunch: 1:00-2:00 (Break)
Period 7: 2:00-2:40 (Teaching)
Period 8: 2:40-3:20 (Teaching)
```

## 🔧 Setup Instructions

### 1. Run Database Migration
```bash
cd server
node run-timetable-migration.js
```

### 2. Test the System
```bash
node test-timetable-system.js
```

### 3. Start Server
```bash
npm start
```

## 🎯 Key Features

### 1. Day-Specific Periods
- Each day can have different period configurations
- Special periods (Assembly, Sports, Chapel) are day-specific
- Flexible time management per day

### 2. Conflict Prevention
- **Teacher Overlap**: One teacher cannot teach two classes simultaneously
- **Break Periods**: No classes assigned to break periods
- **Real-time Validation**: Immediate conflict detection

### 3. Auto-Generation
- **Smart Algorithm**: Prioritizes core subjects (Math, English, Science)
- **Teacher Availability**: Respects teacher schedules
- **Load Balancing**: Distributes workload across days
- **Conflict Resolution**: Suggests alternatives for conflicts

### 4. Special Period Management
- **Assembly**: Monday only, no classes allowed
- **Sports**: Wednesday only, no classes allowed
- **Chapel**: Friday only, no classes allowed
- **Breaks**: All days, no classes allowed

## 📊 Usage Examples

### Create a New Template
```javascript
POST /api/timetables/templates
{
  "name": "Term 2 2025",
  "description": "Second term timetable",
  "academic_year": "2025",
  "term": "Term 2",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}
```

### Add Special Periods
```javascript
// Add Assembly to Monday
POST /api/timetables/templates/1/periods/Monday
{
  "name": "Assembly",
  "start_time": "08:00:00",
  "end_time": "08:30:00",
  "period_type": "Assembly",
  "is_break": true,
  "sort_order": 1
}

// Add Sports to Wednesday
POST /api/timetables/templates/1/periods/Wednesday
{
  "name": "Sports",
  "start_time": "13:30:00",
  "end_time": "14:30:00",
  "period_type": "Sports",
  "is_break": true,
  "sort_order": 10
}
```

### Generate Timetable
```javascript
POST /api/timetable-generation/templates/1/generate
{
  "options": {
    "clearExisting": true,
    "strategy": "balanced"
  }
}
```

### Check Conflicts
```javascript
GET /api/timetable-generation/templates/1/conflicts
```

## 🔍 Conflict Detection

### Types of Conflicts
1. **Teacher Overlap**: Same teacher assigned to multiple classes
2. **Period Conflicts**: Invalid period assignments
3. **Break Violations**: Classes assigned to break periods

### Conflict Resolution
- **Automatic Suggestions**: Alternative time slots
- **Manual Override**: With justification
- **Conflict Logging**: Track resolution history

## 📈 Analytics & Reporting

### Timetable Statistics
- Total entries generated
- Teacher workload distribution
- Day-wise period utilization
- Conflict resolution rates

### Teacher Workload
- Periods per teacher per week
- Subjects taught per teacher
- Active days per teacher

### Period Utilization
- Teaching periods vs break periods
- Peak usage times
- Underutilized periods

## 🛠️ Technical Implementation

### Database Design
- **Normalized Structure**: Separate tables for templates, days, periods
- **Foreign Key Constraints**: Maintain data integrity
- **Indexes**: Optimized for performance
- **Soft Deletes**: Preserve audit trail

### API Design
- **RESTful Endpoints**: Standard HTTP methods
- **Consistent Response Format**: Success/error handling
- **Authentication**: JWT token-based
- **Audit Logging**: Track all changes

### Generation Algorithm
1. **Load Data**: Templates, periods, subject classes
2. **Create Availability Matrix**: Teacher × Day × Period
3. **Assign Classes**: Priority-based assignment
4. **Detect Conflicts**: Real-time validation
5. **Generate Reports**: Statistics and logs

## 🚨 Error Handling

### Common Errors
- **Template Not Found**: 404 for invalid template IDs
- **Period Overlap**: 400 for overlapping time periods
- **Teacher Conflict**: 400 for double-booking teachers
- **Break Violation**: 400 for assigning classes to breaks

### Validation Rules
- **Required Fields**: Name, academic year, term
- **Time Validation**: No overlapping periods
- **Teacher Availability**: Check before assignment
- **Period Types**: Respect break/teaching classifications

## 🔮 Future Enhancements

### Planned Features
- **Room Management**: Physical classroom assignments
- **Student Conflicts**: Prevent student double-booking
- **Mobile App**: Teacher/student mobile access
- **Calendar Integration**: Export to Google Calendar
- **Notification System**: Timetable change alerts
- **Advanced Analytics**: Detailed reporting dashboard

### Integration Points
- **Attendance System**: Link with existing attendance
- **Results System**: Connect with grade management
- **Student Portal**: Display student timetables
- **Employee Portal**: Show teacher schedules

This timetable system provides a robust foundation for managing complex school schedules with day-specific requirements and automatic conflict prevention.
