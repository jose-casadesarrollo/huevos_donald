'use client'

import type { ReactNode } from 'react'
import { useTransition } from 'react'
import { Button, Modal, toast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/lib/admin/config/types'

/**
 * Shared submit hook for config tabs: runs a server action inside a transition,
 * toasts the outcome and refreshes server data on success.
 */
export function useSave() {
  const router = useRouter()
  const [pending, start] = useTransition()

  function save(fn: () => Promise<ActionResult>, successMsg = 'Cambios guardados', onOk?: () => void) {
    start(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(successMsg)
        router.refresh()
        onOk?.()
      } else {
        toast.danger(res.error ?? 'No se pudo guardar')
      }
    })
  }

  return { pending, save }
}

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 py-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">{title}</h2>
          {description ? <p className="text-muted max-w-2xl text-sm leading-snug">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

/** Subtle inline note (used for "applies to future deliveries only", etc.). */
export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-muted text-xs leading-snug">{children}</p>
}

/** Standard controlled add/edit modal. Render it only while open (mount = open). */
export function FormModal({
  title,
  onClose,
  onSubmit,
  pending,
  submitLabel = 'Guardar',
  size = 'md',
  children,
}: {
  title: string
  onClose: () => void
  onSubmit: () => void
  pending: boolean
  submitLabel?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full'
  children: ReactNode
}) {
  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Modal.Container placement="center" size={size}>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4 py-1">{children}</div>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="secondary">
              Cancelar
            </Button>
            <Button isPending={pending} onPress={onSubmit}>
              {submitLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
