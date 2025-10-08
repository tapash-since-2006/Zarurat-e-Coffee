import React from 'react';
import { timeSinceConsumption } from '../utility/index';

export default function ViewHistoryModal({ history, onClose }) {
  const sortedEntries = [...history].sort((a, b) => b.consumed_at - a.consumed_at);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Drink History</h3>
        <ul className="history-list">
          {sortedEntries.map((entry, idx) => (
            <li className="history-item" key={idx}>
              <span className="history-name">{entry.name}</span> — ₹{entry.cost || 0}
              <br />
              <span className="history-time">
                {timeSinceConsumption(Number(entry.consumed_at))} ago
              </span>
            </li>
          ))}
        </ul>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

