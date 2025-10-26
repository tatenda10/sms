const { pool } = require('../../config/database');
const AuditLogger = require('../../utils/audit');

class TimetableController {
  // ===========================================
  // TEMPLATE MANAGEMENT
  // ===========================================

  // Get all timetable templates
  async getAllTemplates(req, res) {
    const connection = await pool.getConnection();
    try {
      const { academic_year, term, is_active } = req.query;
      
      let whereConditions = [];
      let params = [];
      
      if (academic_year) {
        whereConditions.push('academic_year = ?');
        params.push(academic_year);
      }
      
      if (term) {
        whereConditions.push('term = ?');
        params.push(term);
      }
      
      if (is_active !== undefined) {
        whereConditions.push('is_active = ?');
        params.push(is_active === 'true');
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const [templates] = await connection.execute(`
        SELECT 
          pt.*,
          COUNT(ptd.id) as total_days,
          COUNT(tte.id) as total_entries
        FROM period_templates pt
        LEFT JOIN period_template_days ptd ON pt.id = ptd.template_id AND ptd.is_active = TRUE
        LEFT JOIN timetable_entries tte ON pt.id = tte.template_id AND tte.is_active = TRUE
        ${whereClause}
        GROUP BY pt.id
        ORDER BY pt.created_at DESC
      `, params);

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching timetable templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timetable templates'
      });
    } finally {
      connection.release();
    }
  }

  // Get template by ID with full details
  async getTemplateById(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      
      // Get template details
      const [templates] = await connection.execute(`
        SELECT * FROM period_templates WHERE id = ?
      `, [id]);
      
      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Timetable template not found'
        });
      }
      
      const template = templates[0];
      
      // Get days configuration
      const [days] = await connection.execute(`
        SELECT 
          ptd.*,
          COUNT(p.id) as total_periods
        FROM period_template_days ptd
        LEFT JOIN periods p ON ptd.id = p.template_day_id AND p.is_active = TRUE
        WHERE ptd.template_id = ? AND ptd.is_active = TRUE
        GROUP BY ptd.id
        ORDER BY FIELD(ptd.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
      `, [id]);
      
      // Get periods for each day
      for (let day of days) {
        const [periods] = await connection.execute(`
          SELECT * FROM periods 
          WHERE template_day_id = ? AND is_active = TRUE
          ORDER BY sort_order, start_time
        `, [day.id]);
        day.periods = periods;
      }
      
      template.days = days;
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching timetable template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timetable template'
      });
    } finally {
      connection.release();
    }
  }

  // Create new timetable template
  async createTemplate(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { name, description, academic_year, term, days } = req.body;
      
      // Validate required fields
      if (!name || !academic_year || !term) {
        return res.status(400).json({
          success: false,
          message: 'Name, academic year, and term are required'
        });
      }
      
      // Check if template already exists
      const [existing] = await connection.execute(`
        SELECT id FROM period_templates 
        WHERE name = ? AND academic_year = ? AND term = ?
      `, [name, academic_year, term]);
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Template with this name, year, and term already exists'
        });
      }
      
      // Create template
      const [result] = await connection.execute(`
        INSERT INTO period_templates (name, description, academic_year, term, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [name, description, academic_year, term, req.user.id]);
      
      const templateId = result.insertId;
      
      // Create day configurations
      const defaultDays = days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      for (let dayOfWeek of defaultDays) {
        await connection.execute(`
          INSERT INTO period_template_days (template_id, day_of_week)
          VALUES (?, ?)
        `, [templateId, dayOfWeek]);
      }
      
      await connection.commit();
      
      // Log audit event
      await AuditLogger.log({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'period_templates',
        recordId: templateId,
        newValues: { name, description, academic_year, term }
      });
      
      res.status(201).json({
        success: true,
        message: 'Timetable template created successfully',
        data: { id: templateId, name, academic_year, term }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating timetable template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create timetable template'
      });
    } finally {
      connection.release();
    }
  }

  // Update timetable template
  async updateTemplate(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      
      // Check if template exists
      const [existing] = await connection.execute(`
        SELECT * FROM period_templates WHERE id = ?
      `, [id]);
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Timetable template not found'
        });
      }
      
      // Update template
      await connection.execute(`
        UPDATE period_templates 
        SET name = ?, description = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, description, is_active, req.user.id, id]);
      
      await connection.commit();
      
      // Log audit event
      await AuditLogger.log({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'period_templates',
        recordId: id,
        oldValues: existing[0],
        newValues: { name, description, is_active }
      });
      
      res.json({
        success: true,
        message: 'Timetable template updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating timetable template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update timetable template'
      });
    } finally {
      connection.release();
    }
  }

  // ===========================================
  // PERIOD MANAGEMENT
  // ===========================================

  // Get periods for a specific day
  async getPeriodsForDay(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId, dayOfWeek } = req.params;
      
      const [periods] = await connection.execute(`
        SELECT 
          p.*,
          ptd.day_of_week
        FROM periods p
        JOIN period_template_days ptd ON p.template_day_id = ptd.id
        WHERE ptd.template_id = ? AND ptd.day_of_week = ? AND p.is_active = TRUE
        ORDER BY p.sort_order, p.start_time
      `, [templateId, dayOfWeek]);
      
      res.json({
        success: true,
        data: periods
      });
    } catch (error) {
      console.error('Error fetching periods for day:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch periods for day'
      });
    } finally {
      connection.release();
    }
  }

  // Create period for a specific day
  async createPeriod(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId, dayOfWeek } = req.params;
      const { name, start_time, end_time, period_type, is_break, sort_order } = req.body;
      
      // Get template day ID
      const [templateDays] = await connection.execute(`
        SELECT id FROM period_template_days 
        WHERE template_id = ? AND day_of_week = ?
      `, [templateId, dayOfWeek]);
      
      if (templateDays.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template day not found'
        });
      }
      
      const templateDayId = templateDays[0].id;
      
      // Validate time overlap
      const [overlapping] = await connection.execute(`
        SELECT id FROM periods 
        WHERE template_day_id = ? AND is_active = TRUE
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `, [templateDayId, start_time, start_time, end_time, end_time, start_time, end_time]);
      
      if (overlapping.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Period time overlaps with existing period'
        });
      }
      
      // Create period
      const [result] = await connection.execute(`
        INSERT INTO periods (template_day_id, name, start_time, end_time, period_type, is_break, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [templateDayId, name, start_time, end_time, period_type, is_break || false, sort_order || 0]);
      
      res.status(201).json({
        success: true,
        message: 'Period created successfully',
        data: { id: result.insertId, name, start_time, end_time, period_type }
      });
    } catch (error) {
      console.error('Error creating period:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create period'
      });
    } finally {
      connection.release();
    }
  }

  // Update period
  async updatePeriod(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { name, start_time, end_time, period_type, is_break, sort_order } = req.body;
      
      // Check if period exists
      const [existing] = await connection.execute(`
        SELECT * FROM periods WHERE id = ?
      `, [id]);
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Period not found'
        });
      }
      
      // Validate time overlap (excluding current period)
      const [overlapping] = await connection.execute(`
        SELECT id FROM periods 
        WHERE template_day_id = ? AND id != ? AND is_active = TRUE
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `, [existing[0].template_day_id, id, start_time, start_time, end_time, end_time, start_time, end_time]);
      
      if (overlapping.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Period time overlaps with existing period'
        });
      }
      
      // Update period
      await connection.execute(`
        UPDATE periods 
        SET name = ?, start_time = ?, end_time = ?, period_type = ?, is_break = ?, sort_order = ?
        WHERE id = ?
      `, [name, start_time, end_time, period_type, is_break, sort_order, id]);
      
      res.json({
        success: true,
        message: 'Period updated successfully'
      });
    } catch (error) {
      console.error('Error updating period:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update period'
      });
    } finally {
      connection.release();
    }
  }

  // Delete period
  async deletePeriod(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      
      // Check if period has timetable entries
      const [entries] = await connection.execute(`
        SELECT COUNT(*) as count FROM timetable_entries WHERE period_id = ? AND is_active = TRUE
      `, [id]);
      
      if (entries[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete period with existing timetable entries'
        });
      }
      
      // Soft delete period
      await connection.execute(`
        UPDATE periods SET is_active = FALSE WHERE id = ?
      `, [id]);
      
      res.json({
        success: true,
        message: 'Period deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting period:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete period'
      });
    } finally {
      connection.release();
    }
  }

  // ===========================================
  // TIMETABLE ENTRIES MANAGEMENT
  // ===========================================

  // Get timetable entries for a template
  async getTimetableEntries(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId } = req.params;
      const { dayOfWeek } = req.query;
      
      let whereConditions = ['tte.template_id = ?', 'tte.is_active = TRUE'];
      let params = [templateId];
      
      if (dayOfWeek) {
        whereConditions.push('tte.day_of_week = ?');
        params.push(dayOfWeek);
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
      const [entries] = await connection.execute(`
        SELECT 
          tte.*,
          sc.subject_id,
          sc.employee_number,
          s.name as subject_name,
          s.code as subject_code,
          e.full_name as teacher_name,
          gc.name as class_name,
          st.name as stream_name,
          p.name as period_name,
          p.start_time,
          p.end_time,
          p.period_type,
          p.is_break
        FROM timetable_entries tte
        JOIN subject_classes sc ON tte.subject_class_id = sc.id
        JOIN subjects s ON sc.subject_id = s.id
        JOIN employees e ON sc.employee_number = e.employee_id
        LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id
        LEFT JOIN stream st ON sc.stream_id = st.id
        JOIN periods p ON tte.period_id = p.id
        ${whereClause}
        ORDER BY tte.day_of_week, p.sort_order, p.start_time
      `, params);
      
      res.json({
        success: true,
        data: entries
      });
    } catch (error) {
      console.error('Error fetching timetable entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timetable entries'
      });
    } finally {
      connection.release();
    }
  }

  // Create timetable entry
  async createTimetableEntry(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { templateId } = req.params;
      const { subject_class_id, day_of_week, period_id } = req.body;
      
      // Validate required fields
      if (!subject_class_id || !day_of_week || !period_id) {
        return res.status(400).json({
          success: false,
          message: 'Subject class, day of week, and period are required'
        });
      }
      
      // Check if period is a break period
      const [period] = await connection.execute(`
        SELECT is_break, period_type FROM periods WHERE id = ?
      `, [period_id]);
      
      if (period.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Period not found'
        });
      }
      
      if (period[0].is_break) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign classes to break periods'
        });
      }
      
      // Check for teacher conflicts
      const [conflicts] = await connection.execute(`
        SELECT 
          tte.id,
          s.name as subject_name,
          e.full_name as teacher_name
        FROM timetable_entries tte
        JOIN subject_classes sc ON tte.subject_class_id = sc.id
        JOIN subjects s ON sc.subject_id = s.id
        JOIN employees e ON sc.employee_number = e.employee_id
        WHERE tte.template_id = ? AND tte.day_of_week = ? AND tte.period_id = ? AND tte.is_active = TRUE
        AND sc.employee_number = (
          SELECT employee_number FROM subject_classes WHERE id = ?
        )
      `, [templateId, day_of_week, period_id, subject_class_id]);
      
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Teacher conflict: ${conflicts[0].teacher_name} is already teaching ${conflicts[0].subject_name} at this time`,
          conflict: conflicts[0]
        });
      }
      
      // Create timetable entry
      const [result] = await connection.execute(`
        INSERT INTO timetable_entries (template_id, subject_class_id, day_of_week, period_id, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [templateId, subject_class_id, day_of_week, period_id, req.user.id]);
      
      await connection.commit();
      
      // Log audit event
      await AuditLogger.log({
        userId: req.user.id,
        action: 'CREATE',
        tableName: 'timetable_entries',
        recordId: result.insertId,
        newValues: { templateId, subject_class_id, day_of_week, period_id }
      });
      
      res.status(201).json({
        success: true,
        message: 'Timetable entry created successfully',
        data: { id: result.insertId, subject_class_id, day_of_week, period_id }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating timetable entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create timetable entry'
      });
    } finally {
      connection.release();
    }
  }

  // Update timetable entry
  async updateTimetableEntry(req, res) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { subject_class_id, day_of_week, period_id } = req.body;
      
      // Check if entry exists
      const [existing] = await connection.execute(`
        SELECT * FROM timetable_entries WHERE id = ? AND is_active = TRUE
      `, [id]);
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Timetable entry not found'
        });
      }
      
      // Check for teacher conflicts (excluding current entry)
      const [conflicts] = await connection.execute(`
        SELECT 
          tte.id,
          s.name as subject_name,
          e.full_name as teacher_name
        FROM timetable_entries tte
        JOIN subject_classes sc ON tte.subject_class_id = sc.id
        JOIN subjects s ON sc.subject_id = s.id
        JOIN employees e ON sc.employee_number = e.employee_id
        WHERE tte.template_id = ? AND tte.day_of_week = ? AND tte.period_id = ? AND tte.is_active = TRUE AND tte.id != ?
        AND sc.employee_number = (
          SELECT employee_number FROM subject_classes WHERE id = ?
        )
      `, [existing[0].template_id, day_of_week, period_id, id, subject_class_id]);
      
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Teacher conflict: ${conflicts[0].teacher_name} is already teaching ${conflicts[0].subject_name} at this time`,
          conflict: conflicts[0]
        });
      }
      
      // Update entry
      await connection.execute(`
        UPDATE timetable_entries 
        SET subject_class_id = ?, day_of_week = ?, period_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [subject_class_id, day_of_week, period_id, req.user.id, id]);
      
      await connection.commit();
      
      // Log audit event
      await AuditLogger.log({
        userId: req.user.id,
        action: 'UPDATE',
        tableName: 'timetable_entries',
        recordId: id,
        oldValues: existing[0],
        newValues: { subject_class_id, day_of_week, period_id }
      });
      
      res.json({
        success: true,
        message: 'Timetable entry updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating timetable entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update timetable entry'
      });
    } finally {
      connection.release();
    }
  }

  // Delete timetable entry
  async deleteTimetableEntry(req, res) {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      
      // Check if entry exists
      const [existing] = await connection.execute(`
        SELECT * FROM timetable_entries WHERE id = ? AND is_active = TRUE
      `, [id]);
      
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Timetable entry not found'
        });
      }
      
      // Soft delete entry
      await connection.execute(`
        UPDATE timetable_entries SET is_active = FALSE, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.user.id, id]);
      
      // Log audit event
      await AuditLogger.log({
        userId: req.user.id,
        action: 'DELETE',
        tableName: 'timetable_entries',
        recordId: id,
        oldValues: existing[0]
      });
      
      res.json({
        success: true,
        message: 'Timetable entry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting timetable entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete timetable entry'
      });
    } finally {
      connection.release();
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  // Get available subject classes for timetable
  async getAvailableSubjectClasses(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId } = req.params;
      
      const [subjectClasses] = await connection.execute(`
        SELECT 
          sc.id,
          sc.subject_id,
          sc.employee_number,
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
        ORDER BY s.name, gc.name
      `, [templateId]);
      
      res.json({
        success: true,
        data: subjectClasses
      });
    } catch (error) {
      console.error('Error fetching available subject classes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available subject classes'
      });
    } finally {
      connection.release();
    }
  }

  // Get teacher availability for a specific day and period
  async getTeacherAvailability(req, res) {
    const connection = await pool.getConnection();
    try {
      const { templateId, dayOfWeek, periodId } = req.params;
      
      const [availability] = await connection.execute(`
        SELECT 
          e.employee_id,
          e.full_name as teacher_name,
          CASE 
            WHEN tte.id IS NOT NULL THEN 'busy'
            ELSE 'available'
          END as status,
          tte.subject_class_id,
          s.name as subject_name,
          gc.name as class_name
        FROM employees e
        LEFT JOIN subject_classes sc ON e.employee_id = sc.employee_number
        LEFT JOIN subjects s ON sc.subject_id = s.id
        LEFT JOIN gradelevel_classes gc ON sc.gradelevel_class_id = gc.id
        LEFT JOIN timetable_entries tte ON sc.id = tte.subject_class_id 
          AND tte.template_id = ? 
          AND tte.day_of_week = ? 
          AND tte.period_id = ? 
          AND tte.is_active = TRUE
        WHERE e.employee_id IN (
          SELECT DISTINCT employee_number FROM subject_classes
        )
        ORDER BY e.full_name
      `, [templateId, dayOfWeek, periodId]);
      
      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Error fetching teacher availability:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher availability'
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = new TimetableController();
