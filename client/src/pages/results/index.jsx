import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faGraduationCap, 
  faEdit, 
  faEye, 
  faBookOpen,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';

const ResultsIndex = () => {
  const features = [
    {
      title: 'Papers Management',
      description: 'Manage paper types (Paper 1, Paper 2, Practical, etc.)',
      icon: faFileAlt,
      link: '/dashboard/results/papers',
      color: 'bg-blue-500'
    },
    {
      title: 'Grading Criteria',
      description: 'Configure grade ranges and points for automatic grading',
      icon: faGraduationCap,
      link: '/dashboard/results/grading',
      color: 'bg-green-500'
    },
    {
      title: 'Results Entry',
      description: 'Enter individual paper marks for students',
      icon: faEdit,
      link: '/dashboard/results/entry',
      color: 'bg-purple-500'
    },
    {
      title: 'Coursework Entry',
      description: 'Manage mid-term coursework marks separately',
      icon: faBookOpen,
      link: '/dashboard/results/coursework',
      color: 'bg-orange-500'
    },
    {
      title: 'Results View',
      description: 'View results with positions and detailed breakdowns',
      icon: faEye,
      link: '/dashboard/results/view',
      color: 'bg-indigo-500'
    },
    {
      title: 'Analytics',
      description: 'View performance analytics and reports',
      icon: faChartBar,
      link: '/dashboard/results/analytics',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-base font-bold text-gray-900 mb-2">Results Management</h1>
        <p className="text-sm text-gray-600">
          Comprehensive results management system for academic performance tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center mb-4">
              <div className={`${feature.color} p-3 rounded-lg mr-4`}>
                <FontAwesomeIcon 
                  icon={feature.icon} 
                  className="text-white h-5 w-5" 
                />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
            </div>
            <p className="text-xs text-gray-600">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-600">Total Papers</div>
          <div className="text-lg font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-600">Active Grades</div>
          <div className="text-lg font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-600">Results Entered</div>
          <div className="text-lg font-semibold text-gray-900">-</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-600">Coursework Entries</div>
          <div className="text-lg font-semibold text-gray-900">-</div>
        </div>
      </div>
    </div>
  );
};

export default ResultsIndex;
