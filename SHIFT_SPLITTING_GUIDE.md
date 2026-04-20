# Shift Splitting & Auto-Close Documentation

This document outlines the logic and implementation for automatic shift splitting and auto-closing of time records within the application.

## 1. Overview

To support complex work patterns and accurate time tracking, time entries are now automatically processed to:
1.  **Split** single time ranges into multiple records corresponding to defined shift blocks (Morning, Afternoon, Extra).
2.  **Auto-Close** records at defined boundaries if they end precisely on a shift cut-off, creating a seamless audit trail.
3.  **Classify** each time block with the correct shift type (`Manha`, `Tarde`, `Extra`).

## 2. Shift Boundaries & Rules

The system uses the following strict boundaries to determine shift types:

| Time Range | Shift Type | Notes |
| :--- | :--- | :--- |
| **08:00 - 12:00** | `Manha` | Standard morning shift. |
| **12:01 - 12:59** | Gap (Lunch) | Work during this time is skipped or treated as Extra/Gap depending on start time. |
| **13:00 - 17:00** | `Tarde` | Standard afternoon shift. |
| **17:01 - 23:30** | `Extra` | Overtime / Evening shift. |
| **00:00 - 07:59** | `Extra` | Early morning / Late night overtime. |

### 2.1 Auto-Close Rules
When a record is split at a boundary, or if the logic dictates a forced close:
- **Manha** records auto-close at **12:00**.
- **Tarde** records auto-close at **23:30** (Note: As per specific requirement; typically Tarde ends at 17:00, but logic supports the extended close rule if applied).
- **Extra** records auto-close at **23:30** (End of day boundary).

## 3. Implementation Logic

### 3.1 `splitRecordByShiftBoundaries(record)`
Located in `src/utils/shiftSplitLogic.js`.

**Process:**
1.  Takes a record object with `hora_inicio_real` and `hora_fim_real`.
2.  If `hora_fim_real` is missing, it determines the shift type of the start time and returns a single open record.
3.  If an end time exists, it iterates through time blocks:
    - Checks if current time is < 08:00 (Extra)
    - Checks if current time is < 12:00 (Manha)
    - Checks if current time is < 13:00 (Gap - skips to 13:00)
    - Checks if current time is < 17:00 (Tarde)
    - Checks if current time is < 23:30 (Extra)
4.  Creates a new segment for each block the time range covers.
5.  Preserves `usuario_id`, `obra_id`, and location data for all segments.

**Example:**
*Input:* 08:00 to 14:00
*Output:*
1.  08:00 - 12:00 (`Manha`)
2.  13:00 - 14:00 (`Tarde`)

### 3.2 `autoCloseShiftRecord(record)`
Located in `src/utils/shiftSplitLogic.js`.

**Process:**
- Inspects the record's `turno`.
- If valid end times are missing, it calculates the boundary time based on the shift type (e.g., Manha -> 12:00).
- Sets `status_validacao` to 'Fechado Automaticamente' if it modifies the record.

## 4. Component Integration

### 4.1 Clock Out (`ClockOutForm.jsx`)
- Upon clock out, the open record is retrieved.
- A "full" record is constructed using the original start time and the user's selected end time.
- `splitRecordByShiftBoundaries` is called.
- The original open record is **deleted**.
- The new split segments are **inserted**.
- User receives feedback (e.g., "Registo dividido em 2 turnos").

### 4.2 Clock In (`ClockInForm.jsx`)
- Upon clock in, the start time is used to determine the initial `turno`.
- No splitting occurs immediately (single record), but the correct classification is applied.

### 4.3 Records Table (`RecordsTable.jsx`)
- Updated to display the `turno` (Shift) clearly.
- Supports the 'Fechado Automaticamente' status with a visual indicator.

## 5. Testing

To test this functionality:
1.  **Clock In** at 08:00.
2.  **Clock Out** at 14:00.
3.  Check the Records Table. You should see two records:
    - Record 1: 08:00 - 12:00 (`Manha`), Status: Approved/Pending.
    - Record 2: 13:00 - 14:00 (`Tarde`), Status: Pending.
4.  Verify that hours are calculated correctly in summary views (using `recalculateHoursWithSplitRecords`).

## 6. Edge Cases & Limitations

- **Midnight Crossing:** Logic currently hard-stops or splits at 23:30. Work past 23:30 may require 'next day' logic or manual adjustment depending on specific business rules not fully covered here (treated as separate day start).
- **Lunch Gap:** Work performed strictly between 12:00 and 13:00 is currently skipped/treated as a gap jump to 13:00 based on standard shift rules. If work must be tracked here, the gap logic in `shiftSplitLogic.js` requires modification.