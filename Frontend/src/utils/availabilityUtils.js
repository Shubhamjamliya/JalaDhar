/**
 * Availability Helper Utilities for Jaladhaara Expert & User modules
 */

export const ALL_WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const SHORT_DAYS_MAP = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday'
};

export const FULL_TO_SHORT_DAYS_MAP = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun'
};

export const WORKING_DAYS_PRESETS = [
  {
    key: 'ALL_DAYS',
    label: 'All Days (Monday - Sunday)',
    shortLabel: 'All Days (Mon - Sun)',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  {
    key: 'WEEKDAYS',
    label: 'Weekdays (Monday - Friday)',
    shortLabel: 'Weekdays (Mon - Fri)',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  {
    key: 'WEEKENDS_ONLY',
    label: 'Weekends Only (Saturday & Sunday)',
    shortLabel: 'Weekends (Sat & Sun)',
    days: ['Saturday', 'Sunday']
  },
  {
    key: 'MON_TO_SAT',
    label: 'Monday - Saturday',
    shortLabel: 'Mon - Sat',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  {
    key: 'CUSTOM',
    label: 'Custom Days',
    shortLabel: 'Custom Schedule',
    days: []
  }
];

export const WORKING_HOURS_PRESETS = [
  {
    key: 'MORNING',
    label: 'Morning (08:00 AM - 01:00 PM)',
    shortLabel: 'Morning (08:00 AM - 01:00 PM)',
    start: '08:00',
    end: '13:00'
  },
  {
    key: 'AFTERNOON',
    label: 'Afternoon (01:00 PM - 05:00 PM)',
    shortLabel: 'Afternoon (01:00 PM - 05:00 PM)',
    start: '13:00',
    end: '17:00'
  },
  {
    key: 'EVENING',
    label: 'Evening (05:00 PM - 07:00 PM)',
    shortLabel: 'Evening (05:00 PM - 07:00 PM)',
    start: '17:00',
    end: '19:00'
  },
  {
    key: 'MORNING_TO_EVENING',
    label: 'Full Day (08:00 AM - 07:00 PM)',
    shortLabel: 'Full Day (08:00 AM - 07:00 PM)',
    start: '08:00',
    end: '19:00'
  },
  {
    key: 'CUSTOM',
    label: 'Custom Hours',
    shortLabel: 'Custom Hours',
    start: '08:00',
    end: '19:00'
  }
];

/**
 * Convert 24-hour time "HH:MM" to 12-hour format "hh:mm AM/PM"
 */
export const formatTimeToAMPM = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hr = parseInt(parts[0], 10);
  const min = parts[1];
  if (isNaN(hr)) return timeStr;
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12 || 12;
  return `${hr.toString().padStart(2, '0')}:${min} ${ampm}`;
};

/**
 * Normalize any workingDays representation (array, string, etc.) into an array of full day names
 */
export const normalizeWorkingDays = (workingDays) => {
  if (!workingDays) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  if (Array.isArray(workingDays)) {
    return workingDays.map(d => {
      if (SHORT_DAYS_MAP[d]) return SHORT_DAYS_MAP[d];
      const match = ALL_WEEKDAYS.find(w => w.toLowerCase() === d.toLowerCase());
      return match || d;
    }).filter(Boolean);
  }

  if (typeof workingDays === 'string') {
    const trimmed = workingDays.trim().toLowerCase();
    if (trimmed === 'all days' || trimmed === 'everyday' || trimmed === 'all' || trimmed === 'monday - sunday' || trimmed === 'monday to sunday') {
      return [...ALL_WEEKDAYS];
    }
    if (trimmed === 'weekdays' || trimmed === 'monday - friday' || trimmed === 'monday to friday') {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    }
    if (trimmed === 'weekends' || trimmed === 'weekends only' || trimmed === 'saturday & sunday' || trimmed === 'saturday - sunday') {
      return ['Saturday', 'Sunday'];
    }
    if (trimmed === 'monday - saturday' || trimmed === 'monday to saturday') {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    // If comma separated
    if (workingDays.includes(',')) {
      return workingDays.split(',').map(s => {
        const t = s.trim();
        return SHORT_DAYS_MAP[t] || ALL_WEEKDAYS.find(w => w.toLowerCase() === t.toLowerCase()) || t;
      }).filter(Boolean);
    }
    // Default fallback
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
};

/**
 * Determine which preset key matches the given days array
 */
export const detectDaysPreset = (days) => {
  const normalized = normalizeWorkingDays(days);
  if (normalized.length === 7) return 'ALL_DAYS';
  
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (normalized.length === 5 && weekdays.every(d => normalized.includes(d))) return 'WEEKDAYS';

  const weekends = ['Saturday', 'Sunday'];
  if (normalized.length === 2 && weekends.every(d => normalized.includes(d))) return 'WEEKENDS_ONLY';

  const monSat = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (normalized.length === 6 && monSat.every(d => normalized.includes(d))) return 'MON_TO_SAT';

  return 'CUSTOM';
};

/**
 * Get days array from a preset key
 */
export const getDaysFromPreset = (presetKey) => {
  const preset = WORKING_DAYS_PRESETS.find(p => p.key === presetKey);
  return preset ? [...preset.days] : [];
};

/**
 * Determine which preset key matches the given workingHours object/string
 */
export const detectHoursPreset = (workingHours) => {
  if (!workingHours) return 'MORNING_TO_EVENING';
  
  let start = '08:00';
  let end = '19:00';

  if (typeof workingHours === 'object') {
    if (workingHours.preset && WORKING_HOURS_PRESETS.some(p => p.key === workingHours.preset)) {
      return workingHours.preset;
    }
    start = workingHours.start || '08:00';
    end = workingHours.end || '19:00';
  } else if (typeof workingHours === 'string') {
    const s = workingHours.toLowerCase();
    if (s.includes('morning to evening') || (s.includes('08:00') && s.includes('07:00 pm'))) return 'MORNING_TO_EVENING';
    if (s.includes('morning') || (s.includes('08:00') && s.includes('01:00 pm'))) return 'MORNING';
    if (s.includes('afternoon') || (s.includes('01:00') && s.includes('05:00 pm'))) return 'AFTERNOON';
    if (s.includes('evening') || (s.includes('05:00') && s.includes('07:00 pm'))) return 'EVENING';
  }

  const match = WORKING_HOURS_PRESETS.find(p => p.key !== 'CUSTOM' && p.start === start && p.end === end);
  return match ? match.key : 'CUSTOM';
};

/**
 * Normalize workingHours into a clean { start, end, preset, label } object
 */
export const normalizeWorkingHours = (workingHours) => {
  let start = '08:00';
  let end = '19:00';
  let presetKey = 'MORNING_TO_EVENING';

  if (typeof workingHours === 'object' && workingHours !== null) {
    start = workingHours.start || '08:00';
    end = workingHours.end || '19:00';
    presetKey = workingHours.preset || detectHoursPreset(workingHours);
  } else if (typeof workingHours === 'string') {
    presetKey = detectHoursPreset(workingHours);
    const matchedPreset = WORKING_HOURS_PRESETS.find(p => p.key === presetKey);
    if (matchedPreset && presetKey !== 'CUSTOM') {
      start = matchedPreset.start;
      end = matchedPreset.end;
    }
  }

  const formattedStart = formatTimeToAMPM(start);
  const formattedEnd = formatTimeToAMPM(end);
  const label = `${formattedStart} - ${formattedEnd}`;

  return {
    start,
    end,
    preset: presetKey,
    label
  };
};

/**
 * Format workingDays for UI display (e.g. "Monday – Saturday", "All Days", "Mon, Wed, Fri")
 */
export const formatWorkingDays = (workingDays) => {
  const days = normalizeWorkingDays(workingDays);
  if (!days || days.length === 0) return 'Monday – Saturday';
  if (days.length === 7) return 'All Days (Mon – Sun)';

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (days.length === 5 && weekdays.every(d => days.includes(d))) return 'Weekdays (Mon – Fri)';

  const weekends = ['Saturday', 'Sunday'];
  if (days.length === 2 && weekends.every(d => days.includes(d))) return 'Weekends Only (Sat & Sun)';

  const monSat = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (days.length === 6 && monSat.every(d => days.includes(d))) return 'Monday – Saturday';

  return days.map(d => FULL_TO_SHORT_DAYS_MAP[d] || d).join(', ');
};

/**
 * Format workingHours for UI display
 */
export const formatWorkingHours = (workingHours) => {
  const norm = normalizeWorkingHours(workingHours);
  return `${formatTimeToAMPM(norm.start)} – ${formatTimeToAMPM(norm.end)}`;
};

/**
 * Check if a given time is within working hours
 */
export const isCurrentTimeWithinWorkingHours = (workingHours, now = new Date()) => {
  const norm = normalizeWorkingHours(workingHours);
  if (!norm.start || !norm.end) return true;

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  const [startH, startM] = norm.start.split(':').map(Number);
  const [endH, endM] = norm.end.split(':').map(Number);

  const startTimeVal = (isNaN(startH) ? 8 : startH) * 60 + (isNaN(startM) ? 0 : startM);
  const endTimeVal = (isNaN(endH) ? 19 : endH) * 60 + (isNaN(endM) ? 0 : endM);

  return currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal;
};

/**
 * Check if an expert is available on a specific date (YYYY-MM-DD or Date object)
 */
export const isExpertAvailableOnDate = (expert, dateInput) => {
  if (!dateInput) return false;

  let localDate;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      localDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      localDate = new Date(dateInput);
    }
  } else {
    localDate = dateInput;
  }

  if (isNaN(localDate.getTime())) return false;

  // If the date is TODAY and expert is currently paused
  const now = new Date();
  const isToday = localDate.getFullYear() === now.getFullYear() &&
                  localDate.getMonth() === now.getMonth() &&
                  localDate.getDate() === now.getDate();

  if (isToday) {
    if (expert?.pausedUntil && new Date(expert.pausedUntil) > now) {
      return false;
    }
    if (expert?.isOnline === false) {
      return false;
    }
  }

  const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
  const activeDays = normalizeWorkingDays(expert?.workingDays);

  return activeDays.includes(dayOfWeek);
};

/**
 * Compute the comprehensive Smart Live Status for an expert
 * Returns { status: 'ONLINE' | 'PAUSED' | 'OFF_DUTY' | 'OFFLINE', label, badgeColor, isAvailableNow, pausedUntilFormatted }
 */
export const getExpertLiveStatus = (expert, now = new Date()) => {
  if (!expert) {
    return {
      status: 'OFFLINE',
      label: 'Offline',
      badgeColor: 'gray',
      isAvailableNow: false
    };
  }

  // 1. Check if paused with active timer
  if (expert.pausedUntil && new Date(expert.pausedUntil) > now) {
    const resumeTime = new Date(expert.pausedUntil);
    const isTomorrow = resumeTime.getDate() !== now.getDate();
    const formattedTime = formatTimeToAMPM(`${String(resumeTime.getHours()).padStart(2, '0')}:${String(resumeTime.getMinutes()).padStart(2, '0')}`);
    
    return {
      status: 'PAUSED',
      label: isTomorrow ? `Paused (Resumes Tomorrow ${formattedTime})` : `Paused (Resumes ${formattedTime})`,
      shortLabel: 'Busy Today',
      badgeColor: 'amber',
      isAvailableNow: false,
      pausedUntil: expert.pausedUntil,
      pauseReason: expert.pauseReason
    };
  }

  // 2. Check if manually turned offline
  if (expert.isOnline === false) {
    return {
      status: 'OFFLINE',
      label: 'Offline',
      shortLabel: 'Offline',
      badgeColor: 'gray',
      isAvailableNow: false
    };
  }

  // 3. Check if today is a scheduled working day
  const isWorkingDay = isExpertAvailableOnDate(expert, now);
  if (!isWorkingDay) {
    return {
      status: 'OFF_DUTY',
      label: 'Off-Duty (Off Day)',
      shortLabel: 'Off Day',
      badgeColor: 'slate',
      isAvailableNow: false
    };
  }

  // 4. Check if current time is within working hours
  const isWithinHours = isCurrentTimeWithinWorkingHours(expert.workingHours, now);
  if (!isWithinHours) {
    const hoursNorm = normalizeWorkingHours(expert.workingHours);
    return {
      status: 'OFF_DUTY',
      label: `Shift Ended (${hoursNorm.label})`,
      shortLabel: 'Shift Ended',
      badgeColor: 'slate',
      isAvailableNow: false
    };
  }

  // 5. Active & Online
  return {
    status: 'ONLINE',
    label: 'Available Now',
    shortLabel: 'Available Now',
    badgeColor: 'emerald',
    isAvailableNow: true
  };
};

/**
 * Get next available dates for an expert
 */
export const getNextAvailableDates = (expert, count = 6) => {
  const activeDays = normalizeWorkingDays(expert?.workingDays);
  const availableDates = [];
  const today = new Date();

  // Look ahead up to 21 days to find upcoming available dates
  for (let i = 0; i < 21 && availableDates.length < count; i++) {
    const candidateDate = new Date(today);
    candidateDate.setDate(today.getDate() + i);

    const dayOfWeek = candidateDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if expert is available on this candidate date
    const yyyy = candidateDate.getFullYear();
    const mm = String(candidateDate.getMonth() + 1).padStart(2, '0');
    const dd = String(candidateDate.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

    if (isExpertAvailableOnDate(expert, candidateDate)) {
      const shortDay = candidateDate.toLocaleDateString('en-US', { weekday: 'short' });
      const monthStr = candidateDate.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = candidateDate.getDate();

      let labelPrefix = '';
      if (i === 0) labelPrefix = 'Today';
      else if (i === 1) labelPrefix = 'Tomorrow';
      else labelPrefix = shortDay;

      availableDates.push({
        date: dateString,
        dayOfWeek,
        shortDay,
        formattedDisplay: `${labelPrefix}, ${dayNum} ${monthStr}`,
        fullDateDisplay: candidateDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      });
    }
  }

  return availableDates;
};

