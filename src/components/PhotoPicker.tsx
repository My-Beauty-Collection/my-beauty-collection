import { Camera, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { usePhotoUrl } from '@/lib/photos'

/** Stato della foto nel modulo: invariata, nuova (file scelto) oppure rimossa. */
export type PhotoDraft = { kind: 'keep' } | { kind: 'new'; file: File; previewUrl: string } | { kind: 'remove' }

/** Riquadro cipria "Aggiungi foto" con la fotocamera; con una foto mostra l'anteprima e i comandi per cambiarla o toglierla. */
export function PhotoPicker({
  current,
  draft,
  onChange,
}: {
  current: string | null
  draft: PhotoDraft
  onChange: (draft: PhotoDraft) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const savedUrl = usePhotoUrl(draft.kind === 'keep' ? current : null, 'full')

  // L'anteprima locale del file scelto viene liberata quando si sceglie altro o si esce.
  useEffect(() => {
    if (draft.kind !== 'new') return
    return () => URL.revokeObjectURL(draft.previewUrl)
  }, [draft])

  const url = draft.kind === 'new' ? draft.previewUrl : savedUrl
  const hasPhoto = draft.kind === 'new' || (draft.kind === 'keep' && current !== null)
  const pick = () => input.current?.click()

  return (
    <div className="relative mb-3">
      <button
        type="button"
        onClick={pick}
        aria-label={hasPhoto ? 'Cambia foto' : 'Aggiungi foto'}
        className="grid w-full place-items-center overflow-hidden rounded-[18px] border border-accent bg-accent shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        {hasPhoto ? (
          <span className="block aspect-[4/3] w-full">
            {url && <img src={url} alt="" className="size-full object-cover" />}
          </span>
        ) : (
          <span className="flex flex-col items-center gap-1 py-5">
            <Camera className="size-7 text-rose-ink" strokeWidth={1.6} aria-hidden />
            <span className="text-[13px] text-muted-foreground">Aggiungi foto (facoltativa)</span>
          </span>
        )}
      </button>
      {hasPhoto && (
        <div className="absolute right-2.5 bottom-2.5 flex gap-1.5">
          <Button type="button" variant="outline" size="sm" className="h-8 border-transparent px-3 shadow-sm" onClick={pick}>
            <Camera /> Cambia
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-transparent px-3 text-destructive-ink shadow-sm"
            onClick={() => onChange({ kind: 'remove' })}
          >
            <Trash2 /> Rimuovi
          </Button>
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onChange({ kind: 'new', file, previewUrl: URL.createObjectURL(file) })
        }}
      />
    </div>
  )
}
