# 🏃‍♂️ Sports Fixtures Management System - API Documentation

## Overview
The Sports Fixtures Management System provides comprehensive APIs for managing sports activities, teams, fixtures, participants, and announcements in the school management system.

## Base URL
```
/api/sports
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## API Endpoints

### 1. Sports Categories

#### Get All Categories
```http
GET /api/sports/categories
```

**Query Parameters:**
- `active_only` (optional): `true` or `false` - Filter by active status (default: `true`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Football",
      "description": "Soccer/Football matches and tournaments",
      "icon": "fa-futbol",
      "is_active": true,
      "created_at": "2025-01-04T10:00:00.000Z",
      "updated_at": "2025-01-04T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Category by ID
```http
GET /api/sports/categories/:id
```

#### Create Category (Admin Only)
```http
POST /api/sports/categories
```

**Request Body:**
```json
{
  "name": "Basketball",
  "description": "Basketball games and competitions",
  "icon": "fa-basketball-ball"
}
```

#### Update Category (Admin Only)
```http
PUT /api/sports/categories/:id
```

#### Delete Category (Admin Only)
```http
DELETE /api/sports/categories/:id
```

### 2. Sports Teams

#### Get All Teams
```http
GET /api/sports/teams
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sport_category_id` (optional): Filter by sport category
- `active_only` (optional): Filter by active status (default: `true`)
- `search` (optional): Search in name, description, or coach name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Senior Football Team",
      "description": "Main football team for senior students",
      "coach_name": "John Smith",
      "coach_contact": "1234567890",
      "is_active": true,
      "created_at": "2025-01-04T10:00:00.000Z",
      "updated_at": "2025-01-04T10:00:00.000Z",
      "sport_category_name": "Football",
      "sport_category_icon": "fa-futbol",
      "participant_count": 15
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 1,
    "items_per_page": 10,
    "has_next_page": false,
    "has_previous_page": false
  }
}
```

#### Get Team by ID
```http
GET /api/sports/teams/:id
```

#### Get Team Participants
```http
GET /api/sports/teams/:id/participants
```

#### Create Team (Admin/Teacher Only)
```http
POST /api/sports/teams
```

**Request Body:**
```json
{
  "name": "Junior Basketball Team",
  "sport_category_id": 2,
  "description": "Basketball team for junior students",
  "coach_name": "Jane Doe",
  "coach_contact": "0987654321"
}
```

#### Update Team (Admin/Teacher Only)
```http
PUT /api/sports/teams/:id
```

#### Delete Team (Admin Only)
```http
DELETE /api/sports/teams/:id
```

### 3. Sports Fixtures

#### Get All Fixtures
```http
GET /api/sports/fixtures
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sport_category_id` (optional): Filter by sport category
- `team_id` (optional): Filter by team (home or away)
- `status` (optional): Filter by status (`scheduled`, `ongoing`, `completed`, `cancelled`, `postponed`)
- `date_from` (optional): Filter fixtures from date (YYYY-MM-DD)
- `date_to` (optional): Filter fixtures to date (YYYY-MM-DD)
- `search` (optional): Search in title, description, or venue

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Senior Football vs ABC School",
      "description": "Inter-school football match",
      "venue": "School Football Ground",
      "fixture_date": "2025-01-15",
      "fixture_time": "15:00:00",
      "status": "scheduled",
      "result_home_score": null,
      "result_away_score": null,
      "result_notes": null,
      "weather_conditions": null,
      "referee_name": "Mike Johnson",
      "referee_contact": "1111111111",
      "is_home_game": true,
      "created_at": "2025-01-04T10:00:00.000Z",
      "updated_at": "2025-01-04T10:00:00.000Z",
      "sport_category_name": "Football",
      "sport_category_icon": "fa-futbol",
      "home_team_name": "Senior Football Team",
      "home_team_coach": "John Smith",
      "away_team_name": "ABC School",
      "away_team_coach": null,
      "created_by_username": "admin"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 1,
    "items_per_page": 10,
    "has_next_page": false,
    "has_previous_page": false
  }
}
```

#### Get Upcoming Fixtures
```http
GET /api/sports/fixtures/upcoming
```

**Query Parameters:**
- `limit` (optional): Number of fixtures to return (default: 10)
- `sport_category_id` (optional): Filter by sport category

#### Get Fixture by ID
```http
GET /api/sports/fixtures/:id
```

#### Create Fixture (Admin/Teacher Only)
```http
POST /api/sports/fixtures
```

**Request Body:**
```json
{
  "title": "Senior Football vs XYZ School",
  "description": "Friendly match",
  "sport_category_id": 1,
  "home_team_id": 1,
  "away_team_id": null,
  "away_team_name": "XYZ School",
  "venue": "School Football Ground",
  "fixture_date": "2025-01-20",
  "fixture_time": "16:00:00",
  "weather_conditions": "Sunny",
  "referee_name": "Bob Wilson",
  "referee_contact": "2222222222",
  "is_home_game": true
}
```

#### Update Fixture (Admin/Teacher Only)
```http
PUT /api/sports/fixtures/:id
```

**Request Body (for updating results):**
```json
{
  "status": "completed",
  "result_home_score": 2,
  "result_away_score": 1,
  "result_notes": "Great match! Our team won in extra time."
}
```

#### Delete Fixture (Admin Only)
```http
DELETE /api/sports/fixtures/:id
```

### 4. Sports Participants

#### Get All Participants
```http
GET /api/sports/participants
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `team_id` (optional): Filter by team
- `role` (optional): Filter by role (`player`, `captain`, `substitute`, `coach`, `manager`)
- `active_only` (optional): Filter by active status (default: `true`)
- `search` (optional): Search in participant name or student/employee name

#### Get Participants by Team
```http
GET /api/sports/participants/team/:team_id
```

#### Get Participant by ID
```http
GET /api/sports/participants/:id
```

#### Create Participant (Admin/Teacher Only)
```http
POST /api/sports/participants
```

**Request Body:**
```json
{
  "team_id": 1,
  "student_id": 123,
  "participant_name": null,
  "participant_contact": null,
  "role": "player",
  "jersey_number": 10
}
```

**Note:** Either `student_id`, `employee_id`, or `participant_name` is required.

#### Update Participant (Admin/Teacher Only)
```http
PUT /api/sports/participants/:id
```

#### Delete Participant (Admin/Teacher Only)
```http
DELETE /api/sports/participants/:id
```

### 5. Sports Announcements

#### Get All Announcements
```http
GET /api/sports/announcements
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `announcement_type` (optional): Filter by type (`fixture`, `result`, `general`, `training`, `meeting`)
- `sport_category_id` (optional): Filter by sport category
- `team_id` (optional): Filter by team
- `status` (optional): Filter by status (default: `published`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `target_audience` (optional): Filter by target audience
- `search` (optional): Search in title or content

#### Get Dashboard Announcements
```http
GET /api/sports/announcements/dashboard
```

**Query Parameters:**
- `limit` (optional): Number of announcements to return (default: 5)
- `sport_category_id` (optional): Filter by sport category

#### Get Announcement by ID
```http
GET /api/sports/announcements/:id
```

#### Create Announcement (Admin/Teacher Only)
```http
POST /api/sports/announcements
```

**Request Body:**
```json
{
  "title": "Football Match Tomorrow",
  "content": "Don't forget about the football match tomorrow at 3 PM. Come support our team!",
  "announcement_type": "fixture",
  "sport_category_id": 1,
  "team_id": 1,
  "fixture_id": 1,
  "priority": "high",
  "status": "published",
  "start_date": "2025-01-15T00:00:00.000Z",
  "end_date": "2025-01-16T23:59:59.000Z",
  "target_audience": "all"
}
```

#### Update Announcement (Admin/Teacher Only)
```http
PUT /api/sports/announcements/:id
```

#### Delete Announcement (Admin Only)
```http
DELETE /api/sports/announcements/:id
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### Creating a Complete Sports Event

1. **Create a sports category** (if not exists):
```bash
POST /api/sports/categories
{
  "name": "Football",
  "description": "Soccer/Football matches",
  "icon": "fa-futbol"
}
```

2. **Create a team**:
```bash
POST /api/sports/teams
{
  "name": "Senior Football Team",
  "sport_category_id": 1,
  "coach_name": "John Smith",
  "coach_contact": "1234567890"
}
```

3. **Add team members**:
```bash
POST /api/sports/participants
{
  "team_id": 1,
  "student_id": 123,
  "role": "captain",
  "jersey_number": 10
}
```

4. **Create a fixture**:
```bash
POST /api/sports/fixtures
{
  "title": "Senior Football vs ABC School",
  "sport_category_id": 1,
  "home_team_id": 1,
  "away_team_name": "ABC School",
  "venue": "School Ground",
  "fixture_date": "2025-01-15",
  "fixture_time": "15:00:00"
}
```

5. **Create an announcement**:
```bash
POST /api/sports/announcements
{
  "title": "Football Match Tomorrow",
  "content": "Support our team!",
  "announcement_type": "fixture",
  "sport_category_id": 1,
  "team_id": 1,
  "fixture_id": 1,
  "priority": "high",
  "status": "published"
}
```

6. **Update fixture with results**:
```bash
PUT /api/sports/fixtures/1
{
  "status": "completed",
  "result_home_score": 2,
  "result_away_score": 1,
  "result_notes": "Great victory!"
}
```

## Database Schema

The sports system uses 5 main tables:

1. **sports_categories** - Different sports types
2. **sports_teams** - School teams for each sport
3. **sports_fixtures** - Individual games/events
4. **sports_participants** - Team members and participants
5. **sports_announcements** - Sports-specific announcements

## Migration

To set up the sports system, run the migration script:

```bash
node run-sports-migration.js
```

This will create all necessary tables and insert default sports categories.
