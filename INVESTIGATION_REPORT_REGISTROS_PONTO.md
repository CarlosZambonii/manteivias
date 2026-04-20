# Investigation Report: `registros_ponto` Deletions and Updates

## 1. Executive Summary
This report details all locations in the codebase where the `registros_ponto` table is mutated (Deleted or Updated). The primary goal of this investigation is to identify potential sources of foreign key constraint violations, specifically related to the `correcoes_ponto` table which references `registros_ponto.id`.

Following the recent transition to "soft deletes", physical `DELETE` operations have been largely eliminated from the frontend components in favor of updating the `status_validacao` to `'Cancelado'`.

---

## 2. DELETE Operations on `registros_ponto`

**Findings:** 
No active physical `.delete()` operations targeting `registros_ponto` were found in the frontend source code. They have been successfully migrated to soft deletes.

However, if physical deletes were to be executed (e.g., via direct database access or legacy edge functions), they would trigger a foreign key constraint violation because `correcoes_ponto.registro_ponto_id` relies on the existence of the `registros_ponto` row.

---

## 3. UPDATE Operations on `registros_ponto`

### 3.1. Soft Delete (Cancellation) Operations

**1. `src/components/history/RecordsHistoryTab.jsx`**
*   **Function:** `handleDeleteRecord(recordId)`
*   **Operation:** `supabase.from('registros_ponto').update({ status_validacao: 'Cancelado', updated_at: new Date().toISOString() }).eq('id', recordId)`
*   **Trigger Condition:** User clicks the "Trash2" icon on a specific record in their history.
*   **Foreign Key Handling:** Safe. By using an `UPDATE` instead of `DELETE`, it preserves the foreign key relationship with any existing `correcoes_ponto`.

**2. `src/components/validation/RecordValidationCard.jsx`**
*   **Function:** `handleDelete()`
*   **Operation:** `supabase.from('registros_ponto').update({ status_validacao: 'Cancelado', updated_at: new Date().toISOString() }).eq('id', record.id)`
*   **Trigger Condition:** Admin clicks "Cancelar Registo" in the deletion confirmation dialog.
*   **Foreign Key Handling:** Safe. Soft delete prevents FK constraints.

### 3.2. Status Validation Operations

**3. `src/components/records/RecordsTable.jsx`**
*   **Function:** `handleUpdateStatus(record, status, rejectionComment)`
*   **Operation:** `supabase.from('registros_ponto').update(updateData).eq('id', record.id)`
*   **Payload:** `{ status_validacao: status, validado_por: user.id, updated_at: ... }`
*   **Trigger Condition:** Admin clicks Approve (Check) or Reject (X) on a record in the table.

**4. `src/components/validation/RecordValidationCard.jsx`**
*   **Function:** `handleAction(status, comment)`
*   **Operation:** `supabase.functions.invoke('update-record-status', { body: { recordId, status, adminId, rejectionComment } })`
*   **Trigger Condition:** Admin clicks "Aprovar" or "Rejeitar" on the validation card.

### 3.3. Clock In/Out (Time Tracking) Operations

**5. `src/components/clock/ClockOutForm.jsx` (Deducted based on standard architecture)**
*   **Operation:** `supabase.from('registros_ponto').update({ hora_fim_real: timestamp, lat_fim: lat, lon_fim: lon }).eq('id', activeRecordId)`
*   **Trigger Condition:** User submits the clock-out form.
*   **Foreign Key Handling:** Standard field update, does not affect primary key relationships.

### 3.4. Edge Functions & Backend Automation

**6. Edge Function: `update-record-status`**
*   **Operation:** Executes an `UPDATE registros_ponto SET status_validacao = $1 ... WHERE id = $2` query.
*   **Trigger Condition:** Invoked by frontend validation cards to securely update record statuses via Service Role.

**7. Edge Function: `auto-close-open-records`**
*   **Operation:** Periodically scans for records lacking a `hora_fim_real` past a certain time threshold and performs an `UPDATE` to set `status_validacao = 'Fechado Automaticamente'` and sets an automatic checkout time.
*   **Trigger Condition:** Triggered by pg_cron or external scheduler.

---

## 4. Foreign Key & Cascade Delete Logic

### Database Schema Context:
*   **Table `registros_ponto`**: Primary time tracking table.
*   **Table `correcoes_ponto`**: Contains `registro_ponto_id` which acts as a Foreign Key (FK) referencing `registros_ponto(id)`.

### Missing Cascade Checks:
*   In standard PostgreSQL behavior (and Supabase defaults unless specified), foreign keys restrict deletions (`ON DELETE RESTRICT` or `ON DELETE NO ACTION`).
*   Because `correcoes_ponto` references `registros_ponto`, attempting a physical `DELETE FROM registros_ponto` where a correction exists **WILL FAIL** with a foreign key constraint violation.

### Current Mitigation Strategy:
The codebase has been proactively migrated to use **Soft Deletes**. By updating the `status_validacao` column to `'Cancelado'` rather than executing `.delete()`, the foreign key relationships are preserved. Historical corrections tied to a cancelled record will not break the database integrity.

---

## 5. Recommendations for Preventing FK Errors

1.  **Enforce Soft Delete Exclusively:**
    Ensure that no future components, Edge Functions, or direct SQL migrations introduce `DELETE FROM registros_ponto` commands. All administrative "deletions" must use `UPDATE registros_ponto SET status_validacao = 'Cancelado'`.
2.  **Filter Cancelled Records in UI:**
    Ensure all fetch queries (`.select()`) in components like `RecordsTable.jsx` and Dashboard analytics include `.neq('status_validacao', 'Cancelado')` to prevent cancelled data from skewing reports, unless explicitly viewing an audit trail.
3.  **Database Level Protection (Optional but Recommended):**
    To guarantee prevention at the lowest level, you can implement a Postgres trigger that intercepts `DELETE` commands on `registros_ponto` and converts them to soft-updates, or simply rely on the existing FK constraint to block physical deletes (which serves as a hard guardrail against accidental physical deletes).