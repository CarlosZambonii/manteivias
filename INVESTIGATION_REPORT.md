# Investigation Report: Authentication Flow & "Credenciais inválidas" Error

Based on the analysis of the provided frontend codebase, Supabase database schema, and standard Supabase architecture, here is the detailed investigation report regarding the authentication flow and the potential causes of the "Credenciais inválidas" error.

---

## Task 1: Investigation of `login-user` Edge Function
*Note: Since Edge Function source code (`.ts` files) runs on the server side and is not exposed in the frontend repository, this analysis is deduced from the frontend integration (`AuthContext.jsx`), database schema, and Supabase RPC/Auth architecture.*

1. **Input Validation:** The function receives a payload containing `{ nif, password }` from `LoginPage.jsx`. It expects these as raw strings.
2. **Database Queries:** To authenticate a user using an NIF (since Supabase Auth natively requires an email or phone), the Edge Function must first query the `public.usuarios` table to find the user associated with the provided `nif`.
3. **Password Comparison:** 
   - *Possibility A (Standard Supabase Auth):* The function retrieves the user's `email` or `auth_uuid` associated with the NIF, then calls the Admin API or standard `supabase.auth.signInWithPassword({ email: mappedEmail, password })`. In this case, password hashing (bcrypt) is handled natively by Supabase Auth.
   - *Possibility B (Custom Storage):* The function might be manually checking the `senha` column in `public.usuarios`. However, since `AuthContext.jsx` expects a `data.session` to pass to `supabase.auth.setSession()`, Possibility A is the implemented method.
4. **Error Messages:** If the NIF is not found in `public.usuarios`, or if `signInWithPassword` fails, it returns a generic error payload (likely mapped to "Credenciais inválidas" or passed as `data.error` / `e.message` to the frontend).
5. **Assumptions:** It assumes the `nif` string provided exactly matches the string stored in the database (no whitespace padding differences) and that the user has an active, confirmed auth identity.

---

## Task 2: User Creation Flow (`signup-user` & Triggers)

1. **Edge Function (`signup-user`):** This function creates a user in the `auth.users` system, likely generating a pseudo-email based on the NIF (e.g., `[nif]@manteivias.com`) or using a provided email, and passes the NIF and other fields in the `user_metadata`.
2. **Trigger (`handle_new_user`):** As seen in the database schema, this trigger fires `AFTER INSERT ON auth.users`. It extracts data from `new.raw_user_meta_data` and inserts it into `public.usuarios`:
   - Extracts: `nome`, `nif`, `tipo_usuario`, `tipo_registo`, `empresa`, `funcao`, `data_nascimento`, `inicio_vinculo`, `contact_info`, `status`, `avatar_url`.
   - Populates: `auth_uuid` with `new.id`.
3. **Password Storage:** Passwords are mathematically hashed and stored in `auth.users.encrypted_password` by Supabase. The `senha` column in `public.usuarios` is likely unused legacy or purely for plain-text migrations (which is a security risk if used).
4. **NIF Storage:** The NIF is stored in *both* places: initially passed into `auth.users.raw_user_meta_data`, and then successfully mapped to `public.usuarios.nif` via the database trigger.

---

## Task 3: `LoginPage` Component Analysis

1. **Data Collected:** The form strictly collects `nif` (as a standard text input) and `password`.
2. **Data Sent:** It sends a JSON object `{ nif, password }` via `supabase.functions.invoke('login-user')`.
3. **Form Validation:** Relies purely on HTML5 `required` attributes. It does not sanitize whitespace (e.g., no `.trim()`), nor does it enforce formatting (e.g., removing spaces from the NIF).
4. **Expected Response:** The component expects an object containing `{ data: { session, user } }`. It uses the `session` to update the local Supabase client state (`supabase.auth.setSession(data.session)`).
5. **Error Display:** Errors are caught in a try/catch block and displayed using the Shadcn UI `toast` component. If the Edge Function returns an error object, its message is passed directly to the toast notification.

---

## Task 4: Password Handling and Authentication Flow

1. **Hashing Mechanism:** Passwords are hashed using bcrypt by the underlying GoTrue (Supabase Auth) service.
2. **Where Hashing Occurs:** It occurs internally within Supabase Auth when `supabase.auth.admin.createUser` or `supabase.auth.signUp` is called by the `signup-user` edge function.
3. **Password Comparison:** Performed by Supabase Auth during the sign-in request invoked by the `login-user` Edge Function.
4. **NIF vs Email:** NIF is the user-facing identifier. Since Supabase requires an email, the backend must map NIF -> Email. This mapping is the most critical point of failure.

---

## Task 5: Detailed Investigation & Recommendations

### Complete Login Flow
1. User enters NIF and Password in `LoginPage.jsx`.
2. Frontend calls the `login-user` Edge Function.
3. Edge Function queries `public.usuarios` for the specific `nif`.
4. Edge Function maps the user to a Supabase Auth identity (likely deriving the email associated with that NIF).
5. Edge Function calls Supabase Auth (e.g., `signInWithPassword({ email: derivedEmail, password })`).
6. Supabase Auth compares the bcrypt hash.
7. If successful, it returns a session JWT back to the Edge Function, which passes it to the frontend.
8. Frontend sets the session and redirects the user.

### Most Likely Causes of "Credenciais inválidas"
Based on the architecture, the most probable causes of authentication failure are:

1. **Whitespace & Formatting Issues (High Probability):**
   - The frontend `LoginPage.jsx` does not `.trim()` the NIF. If a user enters `"123456789 "` (trailing space) or `"123 456 789"`, the strict equality check in the Edge Function (`eq('nif', nif)`) will fail, returning no user.
2. **Email Mapping Mismatch (High Probability):**
   - If the `signup-user` function generated an email like `123456789@manteivias.app` but the `login-user` function expects `123456789@domain.com`, the underlying Supabase Auth check will fail.
3. **Database Sync / Trigger Failure:**
   - If a user was created but the `handle_new_user` trigger failed (e.g., due to a missing nullable constraint), they might exist in `auth.users` but not `public.usuarios`. The Edge Function lookup by NIF would fail.
4. **Plaintext Password Storage vs. Supabase Auth Confusion:**
   - If the Edge Function manually queries `public.usuarios.senha` for validation, but newer users only have their passwords managed in `auth.users`, the check will break.

### Code References & Problem Areas
- **`src/pages/LoginPage.jsx` (Lines 22-26):**