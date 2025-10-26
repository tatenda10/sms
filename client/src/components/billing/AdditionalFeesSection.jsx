import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, 
  faBook, 
  faFileAlt, 
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';

const AdditionalFeesSection = ({ studentRegNumber }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentRegNumber) {
      loadStudentAssignments();
    }
  }, [studentRegNumber]);

  const loadStudentAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/additional-fees/assignments/student/${studentRegNumber}/year/${new Date().getFullYear()}`);
      const data = await response.json();
      if (data.success) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
      case 'pending':
        return <FontAwesomeIcon icon={faClock} className="text-warning" />;
      case 'overdue':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger" />;
      default:
        return <FontAwesomeIcon icon={faClock} className="text-secondary" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-success',
      pending: 'bg-warning',
      partial: 'bg-info',
      overdue: 'bg-danger',
      waived: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  const getFeeIcon = (feeType) => {
    switch (feeType) {
      case 'annual':
        return <FontAwesomeIcon icon={faBook} className="me-1" />;
      case 'one_time':
        return <FontAwesomeIcon icon={faFileAlt} className="me-1" />;
      default:
        return <FontAwesomeIcon icon={faDollarSign} className="me-1" />;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h6 className="card-title">
            <FontAwesomeIcon icon={faDollarSign} className="me-2" />
            Additional Fees
          </h6>
        </div>
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h6 className="card-title">
            <FontAwesomeIcon icon={faDollarSign} className="me-2" />
            Additional Fees
          </h6>
        </div>
        <div className="card-body text-center text-muted">
          <FontAwesomeIcon icon={faDollarSign} size="2x" className="mb-2" />
          <p>No additional fees assigned to this student</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="card-title">
          <FontAwesomeIcon icon={faDollarSign} className="me-2" />
          Additional Fees
        </h6>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Fee Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.id}>
                  <td>
                    {getFeeIcon(assignment.fee_type)}
                    {assignment.fee_name}
                  </td>
                  <td>
                    <span className={`badge ${
                      assignment.fee_type === 'annual' ? 'bg-primary' : 'bg-info'
                    }`}>
                      {assignment.fee_type}
                    </span>
                  </td>
                  <td>${assignment.amount.toFixed(2)}</td>
                  <td>${assignment.paid_amount.toFixed(2)}</td>
                  <td>
                    <strong className={
                      assignment.balance > 0 ? 'text-danger' : 'text-success'
                    }>
                      ${assignment.balance.toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(assignment.status)}`}>
                      {getStatusIcon(assignment.status)} {assignment.status}
                    </span>
                  </td>
                  <td>
                    {assignment.balance > 0 ? (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          // Navigate to student fee payments page
                          window.location.href = `/dashboard/billing/student-fee-payments?student=${studentRegNumber}`;
                        }}
                      >
                        <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                        Pay
                      </button>
                    ) : (
                      <span className="text-success">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3">
          <small className="text-muted">
            <FontAwesomeIcon icon={faBook} className="me-1" />
            Annual fees are generated once per year for all students
          </small>
        </div>
      </div>
    </div>
  );
};

export default AdditionalFeesSection;
