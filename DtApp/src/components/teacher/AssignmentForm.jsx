import React, { useState } from 'react';
import toast from 'react-hot-toast';
import styles from '../../pages/Login.module.css'; // Reusing some basic styles

function AssignmentForm({ onAdd, onCancel }) {
  const [assignment, setAssignment] = useState({
    year: '1',
    branch: 'INFT',
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
      toast.error('Please enter a subject name.', {
        style: {
          color: 'yellow', // font color
          background: '#ff4d4f', // optional: change background
        },
      }); 
      return;
    }
    if (assignment.batches.length === 0) {
      toast.error('Please select at least one batch or "All".', {
        style: {
          color: 'yellow', // font color
          background: '#ff4d4f', // optional: change background
        },
      });
      return;
    }
    onAdd(assignment);
  };

  return (
    <div className="bg-white border-4 border-[var(--bg-primary)] p-4 rounded-lg space-y-4 mb-16">

      {/* Year Selection */}
      <div>
        <label className="block mb-2 text-secondary text-left font-bold">Year</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setAssignment({ ...assignment, year: y })}
              className={`px-4 py-2 rounded-md border ${assignment.year === y
                  ? "bg-primary text-white border-secondary"
                  : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
                } transition-colors duration-150`}
            >
              {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
            </button>
          ))}
        </div>
      </div>

      {/* Branch Selection */}
      <div>
        <label className="block mb-2 text-secondary text-left font-bold">Branch</label>
        <div className="flex flex-wrap gap-2">
          {['INFT', 'CMPN', 'EXTC', 'EXCS'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setAssignment({ ...assignment, branch: b })}
              className={`px-4 py-2 rounded-md border ${assignment.branch === b
                  ? "bg-primary text-white border-secondary"
                  : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
                } transition-colors duration-150`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Division Selection */}
      <div>
        <label className="block mb-2 text-secondary text-left font-bold">Division</label>
        <div className="flex flex-wrap gap-2">
          {['A', 'B', 'C'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setAssignment({ ...assignment, division: d })}
              className={`px-4 py-2 rounded-md border ${assignment.division === d
                  ? "bg-primary text-white border-secondary"
                  : "bg-tertiary text-secondary border-gray-500 hover:bg-secondary/20"
                } transition-colors duration-150`}
            >
              Div {d}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Name */}
      <input
        type="text"
        placeholder="Subject Name"
        value={assignment.subject}
        required
        onChange={(e) => setAssignment({ ...assignment, subject: e.target.value })}
        className="bg-tertiary border border-gray-500 rounded-md p-2 text-secondary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary w-full"
      />

      {/* Batches Selection */}
      <div>
        <strong className="block mb-2">Batches:</strong>
        <div className="flex flex-wrap items-center gap-4">
          {['1', '2', '3', 'All'].map((batch) => (
            <label key={batch} className="flex items-center gap-1">
              <input
                type="checkbox"
                value={batch}
                checked={assignment.batches.includes(batch)}
                onChange={handleBatchChange}
                className="accent-primary"
              />
              {batch === 'All' ? 'Theory (All)' : `Batch ${batch}`}
            </label>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          type="button"
          onClick={handleAddClick}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add This Class
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>

    </div>

  );
}

export default AssignmentForm;