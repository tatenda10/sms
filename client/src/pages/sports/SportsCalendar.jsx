import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faCalendarAlt,
  faFutbol,
  faBasketballBall,
  faRunning,
  faVolleyballBall,
  faTableTennis,
  faSwimmer,
  faBaseball,
  faFootballBall,
  faHockeyPuck,
  faTrophy,
  faUsers,
  faMapMarkerAlt,
  faFlag
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import BASE_URL from '../../contexts/Api';

const SportsCalendar = () => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  // Icon mapping for sports categories
  const getSportIcon = (iconName) => {
    const iconMap = {
      'fa-futbol': faFutbol,
      'fa-basketball-ball': faBasketballBall,
      'fa-running': faRunning,
      'fa-volleyball-ball': faVolleyballBall,
      'fa-table-tennis': faTableTennis,
      'fa-swimmer': faSwimmer,
      'fa-baseball': faBaseball,
      'fa-football-ball': faFootballBall,
      'fa-hockey-puck': faHockeyPuck
    };
    return iconMap[iconName] || faFutbol;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: { background: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
      ongoing: { background: '#fef3c7', color: '#92400e', border: '#fcd34d' },
      completed: { background: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
      cancelled: { background: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
      postponed: { background: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  };

  // Calculate Easter date (used for Good Friday and Easter Monday)
  const calculateEaster = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  // Get Zimbabwe public holidays for a given year
  const getZimbabweHolidays = (year) => {
    const holidays = [];
    const easter = calculateEaster(year);

    // Fixed date holidays
    holidays.push({ date: `${year}-01-01`, name: 'New Year\'s Day' });
    holidays.push({ date: `${year}-02-21`, name: 'Robert Mugabe National Youth Day' });
    holidays.push({ date: `${year}-04-18`, name: 'Independence Day' });
    holidays.push({ date: `${year}-05-01`, name: 'Workers\' Day' });
    holidays.push({ date: `${year}-05-25`, name: 'Africa Day' });
    holidays.push({ date: `${year}-08-11`, name: 'Heroes\' Day' });
    holidays.push({ date: `${year}-08-12`, name: 'Defence Forces Day' });
    holidays.push({ date: `${year}-12-22`, name: 'Unity Day' });
    holidays.push({ date: `${year}-12-25`, name: 'Christmas Day' });
    holidays.push({ date: `${year}-12-26`, name: 'Boxing Day' });

    // Easter-based holidays
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);

    holidays.push({ 
      date: `${goodFriday.getFullYear()}-${String(goodFriday.getMonth() + 1).padStart(2, '0')}-${String(goodFriday.getDate()).padStart(2, '0')}`, 
      name: 'Good Friday' 
    });
    holidays.push({ 
      date: `${easterMonday.getFullYear()}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`, 
      name: 'Easter Monday' 
    });

    return holidays;
  };

  useEffect(() => {
    fetchFixtures();
  }, [currentDate]);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await axios.get(`${BASE_URL}/sports/fixtures`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          date_from: startDate.toISOString().split('T')[0],
          date_to: endDate.toISOString().split('T')[0],
          limit: 100
        }
      });

      setFixtures(response.data.data || []);
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError('Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getFixturesForDate = (day) => {
    if (!day) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fixtures.filter(fixture => fixture.fixture_date === dateStr);
  };

  const getHolidayForDate = (day) => {
    if (!day) return null;
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidays = getZimbabweHolidays(currentDate.getFullYear());
    return holidays.find(holiday => holiday.date === dateStr) || null;
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    setSelectedDate(day);
    setSelectedFixtures(getFixturesForDate(day));
    setSelectedHoliday(getHolidayForDate(day));
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '400px',
        color: 'var(--text-secondary)'
      }}>
        <div className="loading-spinner" style={{ marginRight: '12px' }}></div>
        <span>Loading calendar...</span>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px 30px',
      background: 'var(--main-bg)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '4px'
          }}>
            Sports Calendar
          </h2>
          <p style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            View and manage sports fixtures by date
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: 'var(--card-bg)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => navigateMonth('prev')}
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '0.75rem' }} />
          </button>
          <h3 style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: 0,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '0.75rem' }} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: '#fee2e2', 
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#dc2626', fontSize: '0.875rem' }} />
          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{error}</span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 380px', 
        gap: '20px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Calendar */}
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '20px' }}>
            {/* Calendar Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '4px',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div 
                  key={day} 
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '0.7rem', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                    padding: '8px 4px'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '4px',
              flex: 1
            }}>
              {days.map((day, index) => {
                const dayFixtures = getFixturesForDate(day);
                const holiday = getHolidayForDate(day);
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() && 
                               currentDate.getFullYear() === new Date().getFullYear();
                const isSelected = selectedDate === day;
                const isHoliday = holiday !== null;

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    style={{
                      minHeight: '100px',
                      padding: '8px 6px',
                      border: `1px solid ${isHoliday ? '#f59e0b' : isSelected ? '#2563eb' : isToday ? '#93c5fd' : 'var(--border-color)'}`,
                      borderRadius: '6px',
                      cursor: day ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      background: !day ? '#f9fafb' : isHoliday ? '#fef3c7' : isSelected ? '#eff6ff' : isToday ? '#eff6ff' : 'var(--card-bg)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => {
                      if (day) {
                        e.currentTarget.style.background = isHoliday ? '#fde68a' : isSelected ? '#eff6ff' : '#f9fafb';
                        e.currentTarget.style.borderColor = isHoliday ? '#f59e0b' : isSelected ? '#2563eb' : '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (day) {
                        e.currentTarget.style.background = isHoliday ? '#fef3c7' : isSelected ? '#eff6ff' : isToday ? '#eff6ff' : 'var(--card-bg)';
                        e.currentTarget.style.borderColor = isHoliday ? '#f59e0b' : isSelected ? '#2563eb' : isToday ? '#93c5fd' : 'var(--border-color)';
                      }
                    }}
                  >
                    {day && (
                      <>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: isHoliday ? '#92400e' : isToday || isSelected ? '#2563eb' : 'var(--text-primary)',
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isHoliday && (
                            <FontAwesomeIcon 
                              icon={faFlag} 
                              style={{ fontSize: '0.65rem', color: '#f59e0b' }}
                            />
                          )}
                          {day}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '4px',
                          flex: 1,
                          overflow: 'hidden'
                        }}>
                          {/* Holiday Display */}
                          {holiday && (
                            <div
                              style={{
                                fontSize: '0.65rem',
                                padding: '4px 6px',
                                border: '1px solid #f59e0b',
                                borderRadius: '4px',
                                background: '#fef3c7',
                                color: '#92400e',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginBottom: '2px'
                              }}
                            >
                              <FontAwesomeIcon 
                                icon={faFlag} 
                                style={{ fontSize: '0.6rem' }}
                              />
                              <span style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {holiday.name}
                              </span>
                            </div>
                          )}
                          {/* Fixtures Display */}
                          {dayFixtures.slice(0, holiday ? 1 : 2).map((fixture, idx) => {
                            const statusColors = getStatusColor(fixture.status);
                            return (
                              <div
                                key={idx}
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '4px 6px',
                                  border: `1px solid ${statusColors.border}`,
                                  borderRadius: '4px',
                                  background: statusColors.background,
                                  color: statusColors.color,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  marginBottom: '2px'
                                }}>
                                  <FontAwesomeIcon 
                                    icon={getSportIcon(fixture.sport_category_icon)} 
                                    style={{ fontSize: '0.6rem' }}
                                  />
                                  <span style={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 500
                                  }}>
                                    {fixture.title}
                                  </span>
                                </div>
                                <div style={{ 
                                  fontSize: '0.6rem', 
                                  opacity: 0.8,
                                  marginTop: '2px'
                                }}>
                                  {formatTime(fixture.fixture_time)}
                                </div>
                              </div>
                            );
                          })}
                          {dayFixtures.length > (holiday ? 1 : 2) && (
                            <div style={{ 
                              fontSize: '0.65rem', 
                              color: 'var(--text-secondary)',
                              textAlign: 'center',
                              padding: '4px',
                              fontWeight: 500
                            }}>
                              +{dayFixtures.length - (holiday ? 1 : 2)} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--sidebar-bg)',
            color: 'white'
          }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              {selectedDate ? `${monthNames[currentDate.getMonth()]} ${selectedDate}, ${currentDate.getFullYear()}` : 'Select a date'}
            </h3>
          </div>

          <div style={{ 
            padding: '20px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {selectedFixtures.length === 0 && !selectedHoliday ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: 'var(--text-secondary)'
              }}>
                <FontAwesomeIcon 
                  icon={faCalendarAlt} 
                  style={{ 
                    fontSize: '2rem', 
                    marginBottom: '12px',
                    color: 'var(--text-light)',
                    opacity: 0.5
                  }} 
                />
                <p style={{ 
                  fontSize: '0.75rem',
                  margin: 0,
                  fontWeight: 500
                }}>
                  {selectedDate ? 'No fixtures on this date' : 'Click on a date to view fixtures'}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px'
              }}>
                {/* Holiday Display */}
                {selectedHoliday && (
                  <div 
                    style={{ 
                      padding: '16px',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <FontAwesomeIcon 
                        icon={faFlag} 
                        style={{ 
                          fontSize: '0.875rem',
                          color: '#f59e0b'
                        }} 
                      />
                      <h4 style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600, 
                        color: '#92400e',
                        margin: 0,
                        flex: 1
                      }}>
                        {selectedHoliday.name}
                      </h4>
                    </div>
                    <p style={{ 
                      fontSize: '0.7rem',
                      color: '#92400e',
                      margin: 0,
                      fontWeight: 500
                    }}>
                      Zimbabwe Public Holiday
                    </p>
                  </div>
                )}
                
                {/* Fixtures Display */}
                {selectedFixtures.length > 0 && (
                  <>
                    {selectedFixtures.map((fixture) => {
                      const statusColors = getStatusColor(fixture.status);
                      return (
                    <div 
                      key={fixture.id} 
                      style={{ 
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <FontAwesomeIcon 
                          icon={getSportIcon(fixture.sport_category_icon)} 
                          style={{ 
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)'
                          }} 
                        />
                        <h4 style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600, 
                          color: 'var(--text-primary)',
                          margin: 0,
                          flex: 1
                        }}>
                          {fixture.title}
                        </h4>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px'
                        }}>
                          <FontAwesomeIcon icon={faTrophy} style={{ fontSize: '0.7rem', color: '#f59e0b' }} />
                          <span style={{ fontWeight: 500 }}>
                            {fixture.home_team_name} vs {fixture.away_team_name}
                          </span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px'
                        }}>
                          <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.7rem' }} />
                          <span>{formatTime(fixture.fixture_time)}</span>
                        </div>
                        
                        {fixture.venue && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px'
                          }}>
                            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ fontSize: '0.7rem', color: '#ef4444' }} />
                            <span>{fixture.venue}</span>
                          </div>
                        )}
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          marginTop: '4px'
                        }}>
                          <span 
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              borderRadius: '4px',
                              background: statusColors.background,
                              color: statusColors.color,
                              border: `1px solid ${statusColors.border}`,
                              display: 'inline-block'
                            }}
                          >
                            {fixture.status}
                          </span>
                        </div>
                      </div>

                      {fixture.result_home_score !== null && (
                        <div style={{ 
                          marginTop: '12px',
                          padding: '12px',
                          background: 'var(--card-bg)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600, 
                            color: 'var(--text-secondary)',
                            marginBottom: '6px'
                          }}>
                            Result
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: 700, 
                            color: 'var(--text-primary)'
                          }}>
                            {fixture.result_home_score} - {fixture.result_away_score}
                          </div>
                          {fixture.result_notes && (
                            <div style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--text-secondary)',
                              marginTop: '6px'
                            }}>
                              {fixture.result_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsCalendar;
