import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, 
  faSearch, 
  faCreditCard, 
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faEye,
  faFileAlt,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import BASE_URL from '../../contexts/Api';

const StudentFeePayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    receipt_number: '',
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch(`${BASE_URL}/students`);
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadStudentAssignments = async (studentRegNumber) => {
    try {
      const response = await fetch(`${BASE_URL}/additional-fees/assignments/student/${studentRegNumber}/year/${new Date().getFullYear()}`);
      const data = await response.json();
      if (data.success) {
        setStudentAssignments(data.data);
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
    }
  };

  const handleStudentSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const student = students.find(s => 
        s.RegNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.Surname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (student) {
        setSelectedStudent(student);
        loadStudentAssignments(student.RegNumber);
      } else {
        alert('Student not found');
      }
    }
  };

  const handlePayment = (assignment) => {
    setSelectedAssignment(assignment);
    setPaymentData({
      payment_amount: assignment.balance.toString(),
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      receipt_number: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/additional-fees/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          student_reg_number: selectedStudent.RegNumber,
          fee_assignment_id: selectedAssignment.id,
          payment_amount: parseFloat(paymentData.payment_amount),
          currency_id: 1, // Assuming USD
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date,
          reference_number: paymentData.reference_number,
          receipt_number: paymentData.receipt_number,
          notes: paymentData.notes
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Payment processed successfully');
        setShowPaymentModal(false);
        loadStudentAssignments(selectedStudent.RegNumber);
      } else {
        alert(data.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment');
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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                Student Fee Payments
              </h3>
            </div>
            <div className="card-body">
              {/* Student Search */}
              <div className="row mb-4">
                <div className="col-md-8">
                  <form onSubmit={handleStudentSearch} className="d-flex">
                    <input 
                      type="text" 
                      className="form-control me-2"
                      placeholder="Search by student name or registration number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      <FontAwesomeIcon icon={faSearch} className="me-1" />
                      Search
                    </button>
                  </form>
                </div>
              </div>

              {/* Selected Student Info */}
              {selectedStudent && (
                <div className="alert alert-info mb-4">
                  <h6 className="mb-1">
                    <FontAwesomeIcon icon={faEye} className="me-2" />
                    Selected Student
                  </h6>
                  <strong>{selectedStudent.Name} {selectedStudent.Surname}</strong> ({selectedStudent.RegNumber})
                </div>
              )}

              {/* Student Fee Assignments */}
              {selectedStudent && (
                <div>
                  <h5>Fee Assignments</h5>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Fee Name</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th>Due Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAssignments.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center text-muted">
                              No fee assignments found for this student
                            </td>
                          </tr>
                        ) : (
                          studentAssignments.map(assignment => (
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
                              <td>{assignment.due_date || 'N/A'}</td>
                              <td>
                                {assignment.balance > 0 ? (
                                  <button 
                                    className="btn btn-sm btn-success"
                                    onClick={() => handlePayment(assignment)}
                                  >
                                    <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                                    Pay
                                  </button>
                                ) : (
                                  <span className="text-success">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Paid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* No Student Selected Message */}
              {!selectedStudent && (
                <div className="text-center text-muted py-5">
                  <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3" />
                  <h5>Search for a student to view their fee assignments</h5>
                  <p>Enter a student's name or registration number above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedAssignment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                  Process Payment
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Student:</strong> {selectedStudent?.Name} {selectedStudent?.Surname} ({selectedStudent?.RegNumber})<br/>
                    <strong>Fee:</strong> {selectedAssignment.fee_name}<br/>
                    <strong>Amount Due:</strong> ${selectedAssignment.balance.toFixed(2)}
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Amount</label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="payment_amount"
                          value={paymentData.payment_amount}
                          onChange={(e) => setPaymentData(prev => ({...prev, payment_amount: e.target.value}))}
                          step="0.01"
                          max={selectedAssignment.balance}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Method</label>
                        <select 
                          className="form-select"
                          name="payment_method"
                          value={paymentData.payment_method}
                          onChange={(e) => setPaymentData(prev => ({...prev, payment_method: e.target.value}))}
                          required
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Mobile Money">Mobile Money</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Payment Date</label>
                        <input 
                          type="date" 
                          className="form-control"
                          name="payment_date"
                          value={paymentData.payment_date}
                          onChange={(e) => setPaymentData(prev => ({...prev, payment_date: e.target.value}))}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Reference Number</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="reference_number"
                          value={paymentData.reference_number}
                          onChange={(e) => setPaymentData(prev => ({...prev, reference_number: e.target.value}))}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Receipt Number</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="receipt_number"
                          value={paymentData.receipt_number}
                          onChange={(e) => setPaymentData(prev => ({...prev, receipt_number: e.target.value}))}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea 
                      className="form-control"
                      name="notes"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData(prev => ({...prev, notes: e.target.value}))}
                      rows="3"
                      placeholder="Optional payment notes..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeePayments;
