# 📅 Timetable Management System - Frontend

## Overview
A comprehensive timetable management system with day-specific periods, special events, and automatic conflict detection.

## 🗂️ File Structure
```
client/src/pages/timetables/
├── Timetables.jsx           # Main timetables list page
├── TemplateView.jsx         # Template view with tabs
├── TemplateEdit.jsx         # Template editing page
├── TimetableGrid.jsx        # Interactive timetable grid
├── TestTimetable.jsx        # Test/status page
└── README.md               # This file
```

## 🚀 Features

### 1. Template Management
- **Create Templates**: Set up timetable templates for different terms/years
- **Day Configuration**: Configure different schedules for each day
- **Special Periods**: Assembly (Monday), Sports (Wednesday), Chapel (Friday)
- **Break Management**: Automatic exclusion of break periods

### 2. Period Management
- **Day-Specific Periods**: Each day can have different period configurations
- **Time Management**: Flexible start/end times per period
- **Period Types**: Teaching, Break, Assembly, Sports, Chapel, Lunch
- **Visual Indicators**: Color-coded periods (green for teaching, red for breaks)

### 3. Timetable Generation
- **Auto-Generation**: Smart algorithm with conflict detection
- **Manual Entry**: Drag-and-drop interface for manual scheduling
- **Conflict Prevention**: Real-time teacher overlap detection
- **Visual Grid**: Interactive timetable grid with click-to-edit

### 4. Conflict Detection
- **Teacher Conflicts**: Prevent double-booking of teachers
- **Break Violations**: No classes assigned to break periods
- **Real-time Validation**: Immediate conflict detection
- **Resolution Tools**: Conflict resolution interface

## 🎯 Usage

### 1. Access Timetables
Navigate to `/dashboard/timetables` to access the main timetables page.

### 2. Create Template
1. Click "Create Template" button
2. Fill in template details (name, year, term)
3. Select days of the week
4. Save template

### 3. Configure Periods
1. Click on a template to view details
2. Go to "Edit Template" tab
3. Select a day from the sidebar
4. Add/edit periods for that day
5. Set special periods (Assembly, Sports, Chapel)

### 4. Generate Timetable
1. Go to template view
2. Click "Generate Timetable" button
3. System will auto-assign classes to available periods
4. Review and resolve any conflicts

### 5. Manual Editing
1. Go to "Timetable" tab
2. Click on empty cells to add classes
3. Click on existing entries to edit/delete
4. System prevents conflicts automatically

## 🔧 Components

### Timetables.jsx
Main page showing all timetable templates with:
- Template cards with statistics
- Create/Edit/Delete actions
- Status indicators (active/inactive)
- Search and filtering

### TemplateView.jsx
Template details page with tabs:
- **Overview**: Template information and day configuration
- **Timetable**: Interactive grid for viewing/editing entries
- **Conflicts**: Conflict detection and resolution
- **Statistics**: Analytics and reporting

### TemplateEdit.jsx
Template editing interface:
- Day sidebar for navigation
- Period management per day
- Add/Edit/Delete periods
- Time validation and overlap detection

### TimetableGrid.jsx
Interactive timetable grid:
- Visual representation of timetable
- Click-to-edit functionality
- Color-coded periods
- Real-time conflict detection
- Add/Edit/Delete entries

## 🎨 UI Features

### Color Coding
- **Green**: Teaching periods (can assign classes)
- **Red**: Break periods (no classes allowed)
- **Blue**: Special periods (Assembly, Sports, Chapel)
- **Gray**: Empty cells (click to add)

### Interactive Elements
- **Hover Effects**: Visual feedback on interactive elements
- **Modal Dialogs**: Clean forms for data entry
- **Loading States**: Progress indicators during operations
- **Error Handling**: User-friendly error messages

### Responsive Design
- **Mobile Friendly**: Works on all screen sizes
- **Grid Layout**: Responsive timetable grid
- **Sidebar Navigation**: Collapsible on mobile
- **Touch Support**: Touch-friendly interface

## 🔌 API Integration

### Endpoints Used
- `GET /api/timetables/templates` - List templates
- `POST /api/timetables/templates` - Create template
- `GET /api/timetables/templates/:id` - Get template details
- `PUT /api/timetables/templates/:id` - Update template
- `GET /api/timetables/templates/:id/periods/:day` - Get periods for day
- `POST /api/timetables/templates/:id/periods/:day` - Add period
- `PUT /api/timetables/periods/:id` - Update period
- `DELETE /api/timetables/periods/:id` - Delete period
- `GET /api/timetables/templates/:id/entries` - Get timetable entries
- `POST /api/timetables/templates/:id/entries` - Add entry
- `PUT /api/timetables/entries/:id` - Update entry
- `DELETE /api/timetables/entries/:id` - Delete entry
- `POST /api/timetable-generation/templates/:id/generate` - Generate timetable
- `GET /api/timetable-generation/templates/:id/conflicts` - Get conflicts
- `GET /api/timetable-generation/templates/:id/stats` - Get statistics

### Authentication
All API calls include JWT token authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 🚨 Error Handling

### Common Errors
- **Template Not Found**: 404 error with navigation back
- **Period Overlap**: Validation error with suggestions
- **Teacher Conflict**: Conflict detection with alternatives
- **Network Error**: Connection error with retry option

### User Feedback
- **Success Messages**: Confirmation of successful operations
- **Error Messages**: Clear error descriptions
- **Loading States**: Progress indicators
- **Validation**: Real-time form validation

## 🔮 Future Enhancements

### Planned Features
- **Room Management**: Physical classroom assignments
- **Student Conflicts**: Prevent student double-booking
- **Mobile App**: Dedicated mobile interface
- **Calendar Export**: Export to Google Calendar
- **Notifications**: Timetable change alerts
- **Advanced Analytics**: Detailed reporting dashboard

### Integration Points
- **Attendance System**: Link with existing attendance
- **Results System**: Connect with grade management
- **Student Portal**: Display student timetables
- **Employee Portal**: Show teacher schedules

## 🧪 Testing

### Test Page
Access `/dashboard/timetables/test` for system status and testing.

### Manual Testing
1. Create a new template
2. Add periods for different days
3. Generate timetable automatically
4. Edit entries manually
5. Check for conflicts
6. View statistics

### API Testing
Use the backend test scripts:
```bash
cd server
node test-timetable-system.js
```

## 📚 Documentation

### Backend Documentation
See `server/docs/TIMETABLE_SYSTEM.md` for complete backend documentation.

### API Documentation
All API endpoints are documented in the backend controllers.

### Database Schema
See `server/migrations/2024-01-16-create-timetable-tables.sql` for database structure.

## 🎉 Getting Started

1. **Run Backend Migration**:
   ```bash
   cd server
   node run-timetable-migration.js
   ```

2. **Start the Application**:
   ```bash
   npm start
   ```

3. **Access Timetables**:
   Navigate to `/dashboard/timetables`

4. **Create Your First Template**:
   Click "Create Template" and follow the wizard

5. **Configure Periods**:
   Edit the template and add periods for each day

6. **Generate Timetable**:
   Use the auto-generation feature or create manually

The timetable system is now ready to use! 🎊
