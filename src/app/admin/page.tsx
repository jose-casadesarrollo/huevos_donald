import { Button, Card } from '@heroui/react'
import { requireAdmin } from '@/lib/auth/roles'
import { signOut } from '@/app/account/actions'

export default async function AdminPage() {
  const user = await requireAdmin()

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Panel admin</Card.Title>
          <Card.Description>{user.email}</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-3">
          <span className="bg-accent text-accent-foreground inline-block rounded-full px-3 py-1 text-xs font-medium">
            Admin
          </span>
          <p className="text-muted text-sm">
            Pronto verás métricas, suscripciones y despachos aquí.
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
