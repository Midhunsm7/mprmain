// Simple session management without cookies
// Store session in localStorage on client, verify on server with token

export interface EmployeeSession {
  employee_id: string;
  employee_login_id: string;
  name: string;
  department?: string;
  designation?: string;
  logged_in_at: string;
  token?: string;
}

// Generate a simple token
export function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Store session in database
export async function createSession(staffId: string, sessionData: any) {
  const { supabaseServer } = await import('@/lib/supabaseServer');
  
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  const { data, error } = await supabaseServer
    .from('employee_sessions')
    .insert([{
      staff_id: staffId,
      token,
      session_data: sessionData,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  
  return { ...sessionData, token };
}

// Verify session
export async function verifySession(token: string): Promise<EmployeeSession | null> {
  const { supabaseServer } = await import('@/lib/supabaseServer');
  
  const { data, error } = await supabaseServer
    .from('employee_sessions')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data.session_data as EmployeeSession;
}

// Delete session
export async function deleteSession(token: string) {
  const { supabaseServer } = await import('@/lib/supabaseServer');
  
  await supabaseServer
    .from('employee_sessions')
    .delete()
    .eq('token', token);
}