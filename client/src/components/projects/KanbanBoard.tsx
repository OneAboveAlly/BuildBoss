import React, { useState, useEffect } from 'react';
import type { TaskWithDetails, TaskStatus, KanbanColumn } from '../../types';
import { PlusIcon } from '@heroicons/react/24/outline';

interface KanbanBoardProps {
  tasks: TaskWithDetails[];
  onTaskUpdate: (task: TaskWithDetails) => void;
  onTaskDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  canEdit: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onStatusChange,
  canEdit
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null);

  const columnDefinitions: Array<{
    id: TaskStatus;
    title: string;
    color: string;
  }> = [
    { id: 'TODO', title: 'Do zrobienia', color: 'bg-gray-100 border-gray-300' },
    { id: 'IN_PROGRESS', title: 'W trakcie', color: 'bg-blue-100 border-blue-300' },
    { id: 'REVIEW', title: 'Do sprawdzenia', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'DONE', title: 'Ukończone', color: 'bg-green-100 border-green-300' },
    { id: 'CANCELLED', title: 'Anulowane', color: 'bg-red-100 border-red-300' }
  ];

  useEffect(() => {
    const newColumns = columnDefinitions.map(col => ({
      ...col,
      tasks: tasks.filter(task => task.status === col.id)
    }));
    setColumns(newColumns);
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: TaskWithDetails) => {
    if (!canEdit) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    
    if (!draggedTask || !canEdit) return;
    
    if (draggedTask.status !== targetStatus) {
      onStatusChange(draggedTask.id, targetStatus);
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'border-l-green-500';
      case 'MEDIUM': return 'border-l-yellow-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'URGENT': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`flex-shrink-0 w-80 ${column.color} rounded-lg border-2 border-dashed`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="p-4 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">
                {column.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-secondary-600">
                  {column.tasks.length}
                </span>
              </div>
            </div>
          </div>

          {/* Column Content */}
          <div className="p-4 space-y-3 min-h-[200px]">
            {column.tasks.map((task) => (
              <div
                key={task.id}
                draggable={canEdit}
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-lg shadow-sm border border-secondary-200 p-4 cursor-move hover:shadow-md transition-shadow ${
                  draggedTask?.id === task.id ? 'opacity-50' : ''
                } border-l-4 ${getPriorityColor(task.priority)}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-secondary-900 text-sm line-clamp-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-1 ml-2">
                      {task.priority === 'URGENT' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      {task.priority === 'HIGH' && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-secondary-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-secondary-500">
                    <div className="flex items-center gap-2">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-600">
                              {task.assignedTo.firstName?.[0] || task.assignedTo.email[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="truncate max-w-20">
                            {task.assignedTo.firstName || task.assignedTo.email.split('@')[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {task.dueDate && (
                      <div className={`text-xs ${
                        new Date(task.dueDate) < new Date() 
                          ? 'text-red-600 font-medium' 
                          : 'text-secondary-500'
                      }`}>
                        {new Date(task.dueDate).toLocaleDateString('pl-PL', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                  
                  {task.estimatedHours && (
                    <div className="text-xs text-secondary-500">
                      Szacowany czas: {task.estimatedHours}h
                      {task.actualHours && ` / Rzeczywisty: ${task.actualHours}h`}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {column.tasks.length === 0 && (
              <div className="text-center py-8 text-secondary-400">
                <p className="text-sm">Brak zadań</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 