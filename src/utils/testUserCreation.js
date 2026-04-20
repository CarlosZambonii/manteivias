import { supabase } from '@/lib/customSupabaseClient';

/**
 * Utility function to test end-to-end user creation via the signup-user edge function.
 * This should be run from the browser console during development/debugging.
 * 
 * Usage:
 * import { testUserCreation } from '@/utils/testUserCreation';
 * testUserCreation();
 */
export const testUserCreation = async () => {
  console.log('%c--- STARTING USER CREATION TEST ---', 'color: #00ff00; font-weight: bold;');
  
  const timestamp = Date.now();
  const testUser = {
    email: `test_debug_${timestamp}@example.com`,
    password: 'Password123!',
    nome: `Test User ${timestamp}`,
    nif: `9${timestamp.toString().slice(-8)}`, // Semi-unique NIF
    empresa: 'Test Company Debug Inc.',
    tipo_usuario: 'subempreiteiro',
    tipo_registo: 'diario',
    funcao: 'Debug Tester',
    data_nascimento: '1990-01-01',
    inicio_vinculo: '2023-01-01',
    contact_info: 'test@debug.com'
  };

  console.log('1. Prepared Test Payload:', testUser);
  console.log('   Checking key fields:', { 
      empresa: testUser.empresa, 
      nif: testUser.nif, 
      tipo: testUser.tipo_usuario 
  });

  try {
     console.log('2. Invoking "signup-user" edge function...');
     const startTime = performance.now();
     
     // Note: we pass 'senha' in the payload as 'password' for auth, or 'senha' depending on how the edge function expects it.
     // EditUserDialog passes 'senha'.
     const payload = { ...testUser, senha: testUser.password };
     
     const { data, error } = await supabase.functions.invoke('signup-user', {
        body: JSON.stringify(payload)
     });

     const endTime = performance.now();
     console.log(`3. Edge function returned in ${(endTime - startTime).toFixed(2)}ms`);

     if (error) {
        console.error('%c❌ Edge function FAILED:', 'color: red; font-weight: bold;', error);
        return;
     }
     
     if (data?.error) {
         console.error('%c❌ Edge function returned Logic Error:', 'color: red; font-weight: bold;', data.error);
         return;
     }

     console.log('✅ Edge function SUCCESS. Response data:', data);

     // Wait for Database Trigger to Propagate
     console.log('4. Waiting 3 seconds for database trigger (handle_new_user) to propagate...');
     await new Promise(r => setTimeout(r, 3000));

     // Verify in Public Table
     console.log(`5. Querying public.usuarios for NIF: ${testUser.nif}`);
     const { data: userData, error: queryError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nif', testUser.nif)
        .single();

     if (queryError) {
         console.error('%c❌ DB Query Failed:', 'color: red;', queryError);
         console.warn('   This might mean the trigger failed or the user wasn\'t created in public table.');
     } else {
         console.log('6. User record found in public.usuarios:', userData);
         
         console.log('7. Verifying Field Integrity:');
         const checks = [
             { field: 'nome', expected: testUser.nome, actual: userData.nome },
             { field: 'empresa', expected: testUser.empresa, actual: userData.empresa },
             { field: 'nif', expected: testUser.nif, actual: userData.nif },
             { field: 'funcao', expected: testUser.funcao, actual: userData.funcao },
             { field: 'tipo_usuario', expected: testUser.tipo_usuario, actual: userData.tipo_usuario },
         ];

         let allMatch = true;
         checks.forEach(check => {
             const match = check.expected === check.actual;
             if (!match) allMatch = false;
             console.log(
                 `   - ${check.field}:`, 
                 match ? '%cMATCH' : '%cMISMATCH', 
                 match ? 'color: green' : 'color: red; font-weight: bold',
                 match ? '' : `(Expected: "${check.expected}", Got: "${check.actual}")`
             );
         });

         if (allMatch) {
             console.log('%c✅ TEST PASSED: All fields saved correctly.', 'color: #00ff00; font-size: 14px; font-weight: bold;');
         } else {
             console.error('%c❌ TEST FAILED: Field mismatch detected.', 'color: red; font-size: 14px; font-weight: bold;');
         }
     }

  } catch (err) {
      console.error('%c❌ EXCEPTION DURING TEST:', 'color: red; font-weight: bold;', err);
  }
  console.log('%c--- END TEST ---', 'color: #00ff00; font-weight: bold;');
};