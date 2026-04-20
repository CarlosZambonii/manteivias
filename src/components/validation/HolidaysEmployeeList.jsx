import React, { useMemo } from 'react';
import HolidaysByUserCard from './HolidaysByUserCard';

const groupHolidays = (records) => {
    const grouped = {};

    records.forEach(record => {
        const userId = record.usuario_id;
        if (!grouped[userId]) {
            grouped[userId] = {
                user: record.usuarios,
                records: [],
                pendingCount: 0
            };
        }

        grouped[userId].records.push(record);
        if (record.status_validacao === 'Pendente') {
            grouped[userId].pendingCount++;
        }
    });

    return Object.values(grouped).sort((a, b) => {
        // Sort by pending count descending, then by name ascending
        if (b.pendingCount !== a.pendingCount) {
            return b.pendingCount - a.pendingCount;
        }
        return (a.user?.nome || '').localeCompare(b.user?.nome || '');
    });
};

const HolidaysEmployeeList = ({ justifications, onApprove, onReject, formatDates, getStatusBadge, publicHolidays }) => {
    const groupedData = useMemo(() => groupHolidays(justifications), [justifications]);

    if (groupedData.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {groupedData.map(group => (
                <HolidaysByUserCard 
                    key={group.user?.id || Math.random()} 
                    group={group} 
                    onApprove={onApprove}
                    onReject={onReject}
                    formatDates={formatDates}
                    getStatusBadge={getStatusBadge}
                    publicHolidays={publicHolidays}
                />
            ))}
        </div>
    );
};

export default HolidaysEmployeeList;