import React from 'react';
import JustificationsByUserList from './JustificationsByUserList';

// This component is now a wrapper around the new list view to maintain compatibility
// if used elsewhere, but ideally should be deprecated.
const JustificationTable = ({ justifications, onUpdateStatus, isLoading }) => {
  return (
    <JustificationsByUserList 
        justifications={justifications} 
        onUpdateStatus={onUpdateStatus}
        isLoading={isLoading}
    />
  );
};

export default JustificationTable;