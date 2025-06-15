import React, { useState } from 'react';
import type { ProjectWithStats } from '../../types';
import { Badge } from '../ui/Badge';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ProjectCalendarProps {
  projects: ProjectWithStats[];
}

export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({ projects }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getProjectsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return projects.filter(project => {
      const deadline = project.deadline ? project.deadline.split('T')[0] : null;
      const startDate = project.startDate ? project.startDate.split('T')[0] : null;
      const endDate = project.endDate ? project.endDate.split('T')[0] : null;
      
      return deadline === dateStr || startDate === dateStr || endDate === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-secondary-100"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const projectsForDay = getProjectsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-secondary-100 p-1 ${
            isToday ? 'bg-primary-50 border-primary-200' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-primary-600' : 'text-secondary-900'
          }`}>
            {day}
          </div>
          
          <div className="space-y-1">
            {projectsForDay.slice(0, 2).map((project) => (
              <div
                key={project.id}
                className="text-xs p-1 rounded bg-primary-100 text-primary-800 truncate"
                title={project.name}
              >
                {project.name}
              </div>
            ))}
            
            {projectsForDay.length > 2 && (
              <div className="text-xs text-secondary-500">
                +{projectsForDay.length - 2} więcej
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-secondary-400" />
          <h2 className="text-lg font-semibold text-secondary-900">
            Kalendarz projektów
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 text-secondary-600" />
          </button>
          
          <div className="px-4 py-2 text-sm font-medium text-secondary-900 min-w-32 text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4 text-secondary-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-secondary-500 border-b border-secondary-200"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 text-xs text-secondary-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-100 rounded"></div>
            <span>Terminy projektów</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-50 border border-primary-200 rounded"></div>
            <span>Dzisiaj</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 