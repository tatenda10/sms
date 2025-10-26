const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class TimetableGenerationController {
  // ===========================================
  // AUTO-GENERATION ALGORITHM
  // ===========================================

  // Generate timetable automatically
  async generateTimetable(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { templateId } = req.params;
      const { options = {} } = req.body;
      
      const startTime = Date.now();
      
      // Get template details
      const [templates] = await connection.execute(`
        SELECT * FROM period_templates WHERE id = ? AND is_active = TRUE
      `, [templateId]);
      
      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Timetable template not found'
        });
      }
      
      const template = templates[0];
      
      // Clear existing entries if requested
      if (options.clearExisting) {
        await connection.execute(`
          UPDATE timetable_entries SET is_active = FALSE WHERE template_id = ?
        `, [templateId]);
      }
      
      // Get all subject classes for this template
      const [subjectClasses] = await connection.execute(`
        SELECT 
          sc.*,
          s.name as subject_name,
          s.code as subject_code,
          e.full_name as teacher_name,
          gc.name as class_name,
          st.name as stream_name
        FROM subject_classes sc
        JOIN subjects s ON sc.subject_id = s.id
        JOIN employees e ON sc.employee_number = e.employee_id
        LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id
        LEFT JOIN stream st ON sc.stream_id = st.id
        WHERE sc.id NOT IN (
          SELECT DISTINCT subject_class_id 
          FROM timetable_entries 
          WHERE template_id = ? AND is_active = TRUE
        )
        ORDER BY 
          CASE s.name 
            WHEN 'Mathematics' THEN 1
            WHEN 'English' THEN 2
            WHEN 'Science' THEN 3
            WHEN 'Physics' THEN 4
            WHEN 'Chemistry' THEN 5
            WHEN 'Biology' THEN 6
            ELSE 7
          END,
          s.name,
          gc.name
      `, [templateId]);
      
      // Get available periods for each day
      const [days] = await connection.execute(`
        SELECT 
          ptd.day_of_week,
          p.id as period_id,
          p.name as period_name,
          p.start_time,
          p.end_time,
          p.period_type,
          p.is_break,
          p.sort_order
        FROM period_template_days ptd
        JOIN periods p ON ptd.id = p.template_day_id
        WHERE ptd.template_id = ? AND ptd.is_active = TRUE AND p.is_active = TRUE
        ORDER BY ptd.day_of_week, p.sort_order, p.start_time
      `, [templateId]);
      
      // Group periods by day
      const periodsByDay = {};
      days.forEach(day => {
        if (!periodsByDay[day.day_of_week]) {
          periodsByDay[day.day_of_week] = [];
        }
        periodsByDay[day.day_of_week].push(day);
      });
      
      // Create teacher availability matrix
      const teacherAvailability = {};
      const generatedEntries = [];
      const conflicts = [];
      
      // Initialize teacher availability
      subjectClasses.forEach(sc => {
        if (!teacherAvailability[sc.employee_number]) {
          teacherAvailability[sc.employee_number] = {};
          Object.keys(periodsByDay).forEach(day => {
            teacherAvailability[sc.employee_number][day] = {};
            periodsByDay[day].forEach(period => {
              teacherAvailability[sc.employee_number][day][period.period_id] = true;
            });
          });
        }
      });
      
      // Generate timetable entries
      for (const subjectClass of subjectClasses) {
        const teacherId = subjectClass.employee_number;
        let assigned = false;
        
        // Try to assign to each day
        for (const dayOfWeek of Object.keys(periodsByDay)) {
          if (assigned) break;
          
          const availablePeriods = periodsByDay[dayOfWeek].filter(period => 
            !period.is_break && 
            teacherAvailability[teacherId][dayOfWeek][period.period_id]
          );
          
          if (availablePeriods.length > 0) {
            // Select period based on strategy
            const selectedPeriod = this.selectPeriod(availablePeriods, options.strategy);
            
            try {
              // Create timetable entry
              const [result] = await connection.execute(`
                INSERT INTO timetable_entries (template_id, subject_class_id, day_of_week, period_id, created_by)
                VALUES (?, ?, ?, ?, ?)
              `, [templateId, subjectClass.id, dayOfWeek, selectedPeriod.period_id, req.user.id]);
              
              // Mark teacher as unavailable for this period
              teacherAvailability[teacherId][dayOfWeek][selectedPeriod.period_id] = false;
              
              generatedEntries.push({
                id: result.insertId,
                subject_class_id: subjectClass.id,
                day_of_week: dayOfWeek,
                period_id: selectedPeriod.period_id,
                subject_name: subjectClass.subject_name,
                teacher_name: subjectClass.teacher_name,
                class_name: subjectClass.class_name
              });
              
              assigned = true;
            } catch (error) {
              console.error('Error creating timetable entry:', error);
              conflicts.push({
                subject_class_id: subjectClass.id,
                subject_name: subjectClass.subject_name,
                teacher_name: subjectClass.teacher_name,
                error: error.message
              });
            }
          }
        }
        
        if (!assigned) {
          conflicts.push({
            subject_class_id: subjectClass.id,
            subject_name: subjectClass.subject_name,
            teacher_name: subjectClass.teacher_name,
            error: 'No available time slots found'
          });
        }
      }
      
      const endTime = Date.now();
      const generationTime = Math.round((endTime - startTime) / 1000);
      
      // Log generation
      await connection.execute(`
        INSERT INTO timetable_generation_logs 
        (template_id, generation_type, status, total_entries, conflicts_found, generation_time_seconds, generated_by, notes)
        VALUES (?, 'Auto', ?, ?, ?, ?, ?, ?)
      `, [
        templateId,
        conflicts.length === 0 ? 'Success' : (generatedEntries.length > 0 ? 'Partial' : 'Failed'),
        generatedEntries.length,
        conflicts.length,
        generationTime,
        req.user.id,
        `Generated ${generatedEntries.length} entries with ${conflicts.length} conflicts`
      ]);
      
      await connection.commit();
      
      // Log audit event
      await AuditLogger.log({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'timetable_generation_logs',
        recordId: templateId,
        newValues: { 
          template_id: templateId, 
          generation_type: 'Auto',
          total_entries: generatedEntries.length,
          conflicts_found: conflicts.length
        }
      });
      
      res.json({
        success: true,
        message: 'Timetable generation completed',
        data: {
          generated_entries: generatedEntries.length,
          conflicts: conflicts.length,
          generation_time_seconds: generationTime,
          entries: generatedEntries,
          conflicts: conflicts
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error generating timetable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate timetable'
      });
    } finally {
      connection.release();
    }
  }

  // ===========================================
  // CONFLICT DETECTION AND RESOLUTION
  // ===========================================

  // Detect conflicts in timetable
  async detectConflicts(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId } = req.params;
      
      // Clear existing conflicts
      await connection.execute(`
        DELETE FROM timetable_conflicts WHERE template_id = ?
      `, [templateId]);
      
      // Detect teacher conflicts
      const [teacherConflicts] = await connection.execute(`
        SELECT 
          tte1.id as entry1_id,
          tte2.id as entry2_id,
          tte1.day_of_week,
          tte1.period_id,
          e.full_name as teacher_name,
          s1.name as subject1_name,
          s2.name as subject2_name,
          gc1.name as class1_name,
          gc2.name as class2_name
        FROM timetable_entries tte1
        JOIN timetable_entries tte2 ON tte1.template_id = tte2.template_id 
          AND tte1.day_of_week = tte2.day_of_week 
          AND tte1.period_id = tte2.period_id 
          AND tte1.id < tte2.id
        JOIN subject_classes sc1 ON tte1.subject_class_id = sc1.id
        JOIN subject_classes sc2 ON tte2.subject_class_id = sc2.id
        JOIN subjects s1 ON sc1.subject_id = s1.id
        JOIN subjects s2 ON sc2.subject_id = s2.id
        JOIN employees e ON sc1.employee_number = e.employee_id
        LEFT JOIN gradelevel_classes gc1 ON sc1.gradelevel_class_id = gc1.id
        LEFT JOIN gradelevel_classes gc2 ON sc2.gradelevel_class_id = gc2.id
        WHERE tte1.template_id = ? 
          AND tte1.is_active = TRUE 
          AND tte2.is_active = TRUE
          AND sc1.employee_number = sc2.employee_number
      `, [templateId]);
      
      // Insert teacher conflicts
      for (const conflict of teacherConflicts) {
        await connection.execute(`
          INSERT INTO timetable_conflicts 
          (template_id, conflict_type, day_of_week, period_id, entry1_id, entry2_id, description)
          VALUES (?, 'Teacher_Overlap', ?, ?, ?, ?, ?)
        `, [
          templateId,
          conflict.day_of_week,
          conflict.period_id,
          conflict.entry1_id,
          conflict.entry2_id,
          `Teacher ${conflict.teacher_name} is assigned to both ${conflict.subject1_name} (${conflict.class1_name}) and ${conflict.subject2_name} (${conflict.class2_name}) at the same time`
        ]);
      }
      
      // Get all conflicts
      const [allConflicts] = await connection.execute(`
        SELECT 
          tc.*,
          p.name as period_name,
          p.start_time,
          p.end_time
        FROM timetable_conflicts tc
        JOIN periods p ON tc.period_id = p.id
        WHERE tc.template_id = ?
        ORDER BY tc.day_of_week, p.sort_order
      `, [templateId]);
      
      res.json({
        success: true,
        data: {
          total_conflicts: allConflicts.length,
          teacher_conflicts: teacherConflicts.length,
          conflicts: allConflicts
        }
      });
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to detect conflicts'
      });
    } finally {
      connection.release();
    }
  }

  // Resolve conflict
  async resolveConflict(req, res) {
    const connection = await pool.getConnection();
    try {
      const { conflictId } = req.params;
      const { resolution_notes } = req.body;
      
      // Update conflict status
      await connection.execute(`
        UPDATE timetable_conflicts 
        SET status = 'Resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?
        WHERE id = ?
      `, [req.user.id, resolution_notes, conflictId]);
      
      res.json({
        success: true,
        message: 'Conflict resolved successfully'
      });
    } catch (error) {
      console.error('Error resolving conflict:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve conflict'
      });
    } finally {
      connection.release();
    }
  }

  // ===========================================
  // TIMETABLE ANALYSIS
  // ===========================================

  // Get timetable statistics
  async getTimetableStats(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId } = req.params;
      
      // Get basic statistics
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT tte.subject_class_id) as total_subject_classes,
          COUNT(tte.id) as total_entries,
          COUNT(DISTINCT tte.day_of_week) as active_days,
          COUNT(DISTINCT sc.employee_number) as teachers_involved
        FROM timetable_entries tte
        JOIN subject_classes sc ON tte.subject_class_id = sc.id
        WHERE tte.template_id = ? AND tte.is_active = TRUE
      `, [templateId]);
      
      // Get teacher workload
      const [teacherWorkload] = await connection.execute(`
        SELECT 
          e.full_name as teacher_name,
          COUNT(tte.id) as total_periods,
          COUNT(DISTINCT tte.day_of_week) as active_days,
          COUNT(DISTINCT s.name) as subjects_taught
        FROM timetable_entries tte
        JOIN subject_classes sc ON tte.subject_class_id = sc.id
        JOIN employees e ON sc.employee_number = e.employee_id
        JOIN subjects s ON sc.subject_id = s.id
        WHERE tte.template_id = ? AND tte.is_active = TRUE
        GROUP BY e.employee_id, e.full_name
        ORDER BY total_periods DESC
      `, [templateId]);
      
      // Get day-wise distribution
      const [dayDistribution] = await connection.execute(`
        SELECT 
          tte.day_of_week,
          COUNT(tte.id) as total_periods,
          COUNT(DISTINCT sc.employee_number) as teachers
        FROM timetable_entries tte
        JOIN subject_classes sc ON tte.subject_class_id = sc.id
        WHERE tte.template_id = ? AND tte.is_active = TRUE
        GROUP BY tte.day_of_week
        ORDER BY FIELD(tte.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
      `, [templateId]);
      
      // Get period utilization
      const [periodUtilization] = await connection.execute(`
        SELECT 
          p.name as period_name,
          p.start_time,
          p.end_time,
          p.period_type,
          COUNT(tte.id) as assigned_classes,
          COUNT(DISTINCT sc.employee_number) as teachers_used
        FROM periods p
        LEFT JOIN timetable_entries tte ON p.id = tte.period_id AND tte.template_id = ? AND tte.is_active = TRUE
        LEFT JOIN subject_classes sc ON tte.subject_class_id = sc.id
        JOIN period_template_days ptd ON p.template_day_id = ptd.id
        WHERE ptd.template_id = ? AND ptd.is_active = TRUE AND p.is_active = TRUE
        GROUP BY p.id, p.name, p.start_time, p.end_time, p.period_type
        ORDER BY p.sort_order
      `, [templateId, templateId]);
      
      res.json({
        success: true,
        data: {
          basic_stats: stats[0],
          teacher_workload: teacherWorkload,
          day_distribution: dayDistribution,
          period_utilization: periodUtilization
        }
      });
    } catch (error) {
      console.error('Error fetching timetable statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timetable statistics'
      });
    } finally {
      connection.release();
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  // Select period based on strategy
  selectPeriod(availablePeriods, strategy = 'balanced') {
    if (availablePeriods.length === 0) return null;
    
    switch (strategy) {
      case 'early':
        // Prefer earlier periods
        return availablePeriods.sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
      
      case 'late':
        // Prefer later periods
        return availablePeriods.sort((a, b) => b.start_time.localeCompare(a.start_time))[0];
      
      case 'balanced':
      default:
        // Prefer middle periods (balanced approach)
        const sorted = availablePeriods.sort((a, b) => a.start_time.localeCompare(b.start_time));
        const middleIndex = Math.floor(sorted.length / 2);
        return sorted[middleIndex];
    }
  }

  // Get generation history
  async getGenerationHistory(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId } = req.params;
      
      const [history] = await connection.execute(`
        SELECT 
          tgl.*,
          e.full_name as generated_by_name
        FROM timetable_generation_logs tgl
        LEFT JOIN employees e ON tgl.generated_by = e.id
        WHERE tgl.template_id = ?
        ORDER BY tgl.created_at DESC
        LIMIT 10
      `, [templateId]);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching generation history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch generation history'
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new TimetableGenerationController();
