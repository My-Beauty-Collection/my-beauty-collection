import { useState } from 'react'
import { toast } from 'sonner'
import type { Product } from '../lib/types'
import { useStore } from '../store'
import { ConfirmDialog } from './common'

/**
 * Conferma ed elimina un prodotto (con la sua foto, gli abbinamenti e il posto nelle Lip Combo).
 * Aperto quando `product` non è null; usato dalla scheda prodotto e dalle segnalazioni.
 */
export function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: Product | null
  onClose: () => void
  onDeleted?: () => void
}) {
  const { data, dispatch, removePhoto } = useStore()
  // Durante l'animazione di chiusura il testo resta quello del prodotto appena chiesto.
  const [shown, setShown] = useState(product)
  if (product && product !== shown) setShown(product)

  const inCombos = shown ? data.combos.some((c) => c.productIds.includes(shown.id)) : false

  const remove = () => {
    if (!product) return
    removePhoto(product.photo)
    dispatch({ type: 'product/delete', id: product.id })
    toast.success(`"${product.name}" eliminato`)
    onDeleted?.()
  }

  return (
    <ConfirmDialog
      open={product !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Eliminare il prodotto?"
      description={
        shown &&
        (inCombos
          ? `"${shown.name}" verrà eliminato insieme ai suoi abbinamenti e tolto dalle Lip Combo (quelle che restano con un solo prodotto vengono eliminate).`
          : `"${shown.name}" verrà eliminato definitivamente.`)
      }
      confirmLabel="Elimina"
      destructive
      onConfirm={remove}
    />
  )
}
