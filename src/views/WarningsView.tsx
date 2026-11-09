import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PageHeader, RowList, SegmentedTabs } from '../components/common'
import { WarningRow } from '../components/ProductRow'
import { useStore } from '../store'

type Filter = 'tutte' | 'pao' | 'scaduti'

export function WarningsView() {
  const { warnings } = useStore()
  const [filter, setFilter] = useState<Filter>('tutte')
  const counts = {
    tutte: warnings.length,
    pao: warnings.filter((w) => w.paoExceeded).length,
    scaduti: warnings.filter((w) => w.expired).length,
  }
  const visible = warnings.filter((w) => filter === 'tutte' || (filter === 'pao' ? w.paoExceeded : w.expired))

  return (
    <>
      <PageHeader title="Scadenze e avvertenze" />
      <p className="-mt-2 mb-3 text-[13px] text-muted-foreground">
        Solo prodotti con limite superato: PAO finito o data di scadenza passata.
      </p>

      {warnings.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="Nessuna segnalazione"
          description="Tutti i tuoi prodotti sono entro il PAO e la data di scadenza."
        />
      ) : (
        <>
          <SegmentedTabs
            ariaLabel="Filtra le segnalazioni"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'tutte', label: `Tutte (${counts.tutte})` },
              { value: 'pao', label: `PAO superato (${counts.pao})` },
              { value: 'scaduti', label: `Scaduti (${counts.scaduti})` },
            ]}
          />
          {visible.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Nessun prodotto.</p>
          ) : (
            <RowList>
              {visible.map((w) => (
                <WarningRow key={w.product.id} warning={w} />
              ))}
            </RowList>
          )}
        </>
      )}
    </>
  )
}
