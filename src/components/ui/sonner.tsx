import { Check, CircleAlert, Info, TriangleAlert } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

/**
 * Messaggi brevi ("Prodotto salvato", "… eliminato") nello stile dell'app: card bianca arrotondata
 * con l'ombra rosata, icona tonda su fondo cipria (rossa per gli errori, con il bordo rosso delle
 * segnalazioni) e pulsante d'azione rosa (es. "Annulla"). Compaiono in basso, sopra la barra.
 */

/** Sopra la barra di navigazione (e l'area sicura dei telefoni con la "home bar"). */
const ABOVE_NAV = "calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px)"

function Bubble({ tone, children }: { tone: "rose" | "red"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-full [&>svg]:size-[18px]",
        tone === "rose" ? "bg-thumb text-rose-ink" : "bg-destructive/10 text-destructive-ink"
      )}
    >
      {children}
    </span>
  )
}

const buttonClass =
  "h-9 shrink-0 cursor-pointer rounded-[10px] px-3.5 text-[13.5px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/60"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      duration={2500}
      gap={8}
      offset={{ bottom: ABOVE_NAV }}
      mobileOffset={{ bottom: ABOVE_NAV, left: 16, right: 16 }}
      style={{ "--width": "398px" } as CSSProperties}
      icons={{
        success: (
          <Bubble tone="rose">
            <Check strokeWidth={2.4} />
          </Bubble>
        ),
        info: (
          <Bubble tone="rose">
            <Info />
          </Bubble>
        ),
        warning: (
          <Bubble tone="red">
            <TriangleAlert />
          </Bubble>
        ),
        error: (
          <Bubble tone="red">
            <CircleAlert />
          </Bubble>
        ),
        loading: (
          <Bubble tone="rose">
            <Spinner className="size-[18px]" />
          </Bubble>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: cn(
            "flex items-center gap-3 rounded-[18px] border bg-card p-3 pr-3.5 text-foreground shadow-[0_8px_24px_rgb(126_69_83/16%)]",
            "data-[type=error]:border-l-4 data-[type=error]:border-l-destructive",
            "data-[type=warning]:border-l-4 data-[type=warning]:border-l-destructive",
            // Impilati: dei messaggi dietro si vede solo il bordo, non il testo.
            "*:transition-opacity data-[expanded=false]:data-[front=false]:*:opacity-0",
            // Senza pulsanti il messaggio non blocca i tocchi su ciò che copre (es. "Aggiungi" in fondo alla lista).
            "not-has-[[data-button]]:pointer-events-none"
          ),
          icon: "shrink-0",
          content: "min-w-0 flex-1",
          title: "text-[15px] leading-snug font-bold break-words",
          description: "mt-0.5 text-[13px] leading-snug text-muted-foreground",
          actionButton: cn(buttonClass, "bg-primary text-primary-foreground hover:bg-rose-ink"),
          cancelButton: cn(buttonClass, "border border-primary bg-card text-rose-ink hover:bg-accent/60"),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
