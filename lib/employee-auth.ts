import { cookies } from "next/headers";

export interface EmployeeSession {
  employee_id: string;
  employee_login_id: string;
  name: string;
  department?: string;
  designation?: string;
  logged_in_at: string;
}

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('employee_session');
    
    console.log("Session cookie check:", {
      hasCookie: !!sessionCookie,
      cookieValue: sessionCookie?.value ? "present" : "missing"
    });

    if (!sessionCookie?.value) {
      console.log("No session cookie found");
      return null;
    }

    const session = JSON.parse(sessionCookie.value) as EmployeeSession;
    
    // Validate session
    if (!session.employee_id || !session.employee_login_id) {
      console.log("Invalid session data");
      return null;
    }

    // Check if session is expired (7 days)
    const loggedInAt = new Date(session.logged_in_at);
    const now = new Date();
    const diffDays = (now.getTime() - loggedInAt.getTime()) / (1000 * 60 * 60 * 24);
    
    console.log("Session expiry check:", {
      loggedInAt: session.logged_in_at,
      now: now.toISOString(),
      diffDays: diffDays.toFixed(2)
    });

    if (diffDays > 7) {
      console.log("Session expired");
      return null;
    }

    console.log("Valid session found for:", session.name);
    return session;
  } catch (error) {
    console.error("Error parsing session:", error);
    return null;
  }
}

export async function updateEmployeeSession(sessionData: EmployeeSession) {
  try {
    const cookieStore = await cookies();
    
    console.log("Setting session cookie:", sessionData);
    
    cookieStore.set({
      name: 'employee_session',
      value: JSON.stringify(sessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    console.log("Session cookie set successfully");
  } catch (error) {
    console.error("Error setting session cookie:", error);
    throw error;
  }
}

export async function deleteEmployeeSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('employee_session');
    console.log("Session cookie deleted");
  } catch (error) {
    console.error("Error deleting session cookie:", error);
  }
}