import { signOut } from '@/app/account/actions'

// The sidebar "Log out" item navigates here; sign out, then redirect to /login.
export default async function LogoutPage() {
  await signOut()
  return null
}
