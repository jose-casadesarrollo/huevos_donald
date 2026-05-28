import { Button, Card } from '@heroui/react'
import { requireUser } from '@/lib/auth/roles'
import { signOut } from './actions'

export default async function AccountPage() {
  const user = await requireUser()

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Hola</Card.Title>
          <Card.Description>{user.email}</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-3">
          <span className="bg-surface-secondary text-foreground inline-block rounded-full px-3 py-1 text-xs font-medium">
            Customer
          </span>
          <p className="text-muted text-sm">
            Aquí gestionarás tu suscripción próximamente.
          </p>
        </Card.Content>
        <Card.Footer>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </Card.Footer>
      </Card>
    </main>
  )
}
