import React from 'react';

const AddEventButton: React.FC = () => (
  <button
    className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl hover:bg-indigo-700 transition"
    onClick={() => document.dispatchEvent(new CustomEvent('openEventModal'))}
    aria-label="Add Event"
  >
    +
  </button>
);

export default AddEventButton;
