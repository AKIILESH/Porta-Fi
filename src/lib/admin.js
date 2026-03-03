// src/lib/admin.js
export const ADMIN_EMAILS = [
  'akilesht2005@gmail.com', // Replace with your email
  'admin@finvault.com'    // Add more admin emails as needed
]

export const isAdmin = (user) => {
  if (!user) return false
  return ADMIN_EMAILS.includes(user.email)
}

// For role-based approach (if you add a role column to users)
export const isAdminByRole = (user) => {
  return user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
}