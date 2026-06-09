import React, { useState } from 'react';
import toast from 'react-hot-toast';
import styles from '../../pages/Login.module.css'; // Reusing some basic styles

function AssignmentForm({ onAdd, onCancel }) {
  const [assignment, setAssignment] = useState({
    year: '1',
    branch: 'IT',
    division: 'A',
    subject: '',
    batches: [],
  });

  const handleBatchChange = (e) => {
    const { value, checked } = e.target;
    let newBatches = [...assignment.batches];

    if (value === 'All') {
      newBatches = checked ? ['All'] : [];
    } else {
      newBatches = newBatches.filter(b => b !== 'All');
      if (checked) {
        newBatches.push(value);
      } else {
        newBatches = newBatches.filter((b) => b !== value);
      }
    }
    setAssignment({ ...assignment, batches: newBatches });
  };

  const handleAddClick = () => {
    if (!assignment.subject) {
      toast.error('Please enter a subject name.');
      return;
    }
    if (assignment.batches.length === 0) {
      toast.error('Please select at least one batch or "All".');
      return;
    }
    onAdd(assignment);
  };

  return (
    <div style={{ border: '1px solid #555', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <select className={styles.formGroup} value={assignment.year} onChange={e => setAssignment({...assignment, year: e.target.value})}>
            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y===1?'st':y===2?'nd':y===3?'rd':'th'} Year</option>)}
        </select>
        <select className={styles.formGroup} value={assignment.branch} onChange={e => setAssignment({...assignment, branch: e.target.value})}>
            {['IT', 'CMPN', 'EXTC', 'EXCS'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className={styles.formGroup} value={assignment.division} onChange={e => setAssignment({...assignment, division: e.target.value})}>
            {['A', 'B', 'C'].map(d => <option key={d} value={d}>Division {d}</option>)}
        </select>
        <input className={styles.formGroup} type="text" placeholder="Subject Name" value={assignment.subject} onChange={e => setAssignment({...assignment, subject: e.target.value})} />
      </div>
      <div style={{ textAlign: 'left', marginTop: '1rem' }}>
        <strong>Batches:</strong>
        {['1', '2', '3', 'All'].map(batch => (
          <label key={batch} style={{ marginRight: '1rem', marginLeft: '0.5rem' }}>
            <input type="checkbox" value={batch} checked={assignment.batches.includes(batch)} onChange={handleBatchChange} />
            {batch === 'All' ? 'Theory (All)' : `Batch ${batch}`}
          </label>
        ))}
      </div>
      <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
        <button type="button" onClick={handleAddClick} style={{flexGrow: 1, padding: '0.5rem', backgroundColor: '#28a745'}}>Add This Assignment</button>
        <button type="button" onClick={onCancel} style={{padding: '0.5rem', backgroundColor: '#6c757d'}}>Cancel</button>
      </div>
    </div>
  );
}

export default AssignmentForm;