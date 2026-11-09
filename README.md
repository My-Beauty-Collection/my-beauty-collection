# Beauty Collection 💄

Inventario personale dei prodotti beauty: scadenze PAO, Lip Combo e wishlist.
Web app mobile-first con i dati su Supabase.

## Funzionalità

- **Home** con saluto personalizzato, accesso diretto a Inventario (e alle sue categorie), Lip Combo e Wishlist,
  e in fondo le **segnalazioni a fisarmonica**: le prime tre, ciascuna con il cestino per eliminare subito il prodotto,
  e il collegamento alla pagina Scadenze e avvertenze (anche lì con il cestino su ogni riga).
  Nessun riepilogo di prodotti aperti, quasi finiti o in scadenza.
- **Inventario** per macro-categoria → sottocategoria (→ tipologia per il Make-up), es.
  *Make-up › Labbra › Matite labbra › Nabla #05*. Ricerca e filtro preferiti.
  Un prodotto multiuso si registra una sola volta, con più **zone d'uso**.
- **Categorie personali**: le categorie predefinite sono uguali per tutti; ogni utente può aggiungere solo per sé
  categorie, sottocategorie (anche dentro quelle predefinite) e, nel Make-up, tipologie, con nome e icona
  (Inventario → *Categorie*, oppure Impostazioni). Eliminandone una, i suoi prodotti passano al livello superiore.
- **Scheda prodotto essenziale**: foto (facoltativa), marca, nome, categoria, data di apertura, PAO,
  scadenza della confezione (facoltativa), valutazione 1–5 stelle, preferito, nota.
  Un prodotto non ancora aperto ha il pulsante rapido **Aperto oggi**, senza passare dal modulo di modifica.
- **PAO**: la fine PAO è calcolata da data di apertura + PAO (10/11/2026 + 12M → 10/11/2027).
- **Avvisi solo a limite superato**: "PAO superato" e "Scaduto" compaiono dal giorno dopo il limite;
  nessun avviso preventivo né countdown.
- **Abbinamenti labbra**: da una matita labbra si scelgono i prodotti labbra con cui sta bene
  (decisi dall'utente, nessun suggerimento automatico).
- **Lip Combo**: dalla matita si selezionano i prodotti abbinati da usare insieme e si salva la Combo
  con nome, preferita e nota facoltativi. Filtri *Tutte* / *Preferite*.
- **Wishlist** separata: ogni desiderio ha nome, marca, categoria e nota, che passano alla scheda
  quando lo si sposta nell'inventario.
- **Backup** JSON (esporta/importa, anche dei backup della prima versione) e prodotti di esempio.

La tassonomia è in [`src/data/taxonomy.ts`](src/data/taxonomy.ts).

## Configurazione Supabase

La struttura del database è in [`supabase/migrations/`](supabase/migrations/): tabelle `products`, `wish_items`,
`lip_combos`, `custom_taxonomy` (categorie personali) e il bucket privato `product-photos` per le foto,
tutto con Row Level Security (ogni utente vede solo i propri dati).

1. Valori del progetto in `.env.local` (vedi `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   e, solo per gli script locali, `SUPABASE_SECRET_KEY`. Il file non finisce su git.
2. Applicare le migrazioni con la Supabase CLI:
   ```bash
   npx supabase login                                   # una volta sola, apre il browser
   npx supabase link --project-ref <project-ref>        # una volta sola
   npx supabase db push --remote                        # applica le migrazioni nuove
   ```
   ⚠️ Usare sempre `--remote`: senza, la CLI prova ad applicarle a un database Supabase locale (Docker).
   Per una modifica futura: `npx supabase migration new <nome>`, scrivere l'SQL, poi `db push --remote`.
3. Account: si creano dall'app, scheda **Crea account** nella schermata di accesso.
   Con "Confirm email" attivo (Authentication → Sign In / Providers → Email) arriva un'email con un link di conferma:
   in quel caso impostare in **Authentication → URL Configuration** il Site URL all'indirizzo dell'app
   (`https://my-beauty-collection.github.io/my-beauty-collection/`, oppure `http://localhost:5173` in locale) e aggiungere
   entrambi tra le Redirect URLs.
   Con "Confirm email" disattivato l'account è subito attivo.
   Per impedire nuove registrazioni: disattivare "Allow new users to sign up" (Sign In / Providers).
   Ogni account vede solo i propri dati.
   ⚠️ Non usare `npx supabase config push` con il `config.toml` generato: sovrascriverebbe varie impostazioni del progetto.

Senza `.env.local` l'app funziona in **modalità locale** (dati salvati solo nel browser).

## Uso in locale

```bash
npm install
npm run dev      # apri http://localhost:5173
```

Dal telefono, collegato alla stessa rete Wi-Fi del computer:

```bash
npm run dev -- --host   # apri dal telefono l'indirizzo "Network" mostrato (es. http://192.168.1.20:5173)
```

Altri comandi:

```bash
npm test         # test della logica (PAO e avvisi, abbinamenti, Lip Combo, migrazione dati, sincronizzazione)
npm run build    # versione ottimizzata in dist/
npm run preview -- --host   # serve la versione ottimizzata, anche al telefono
```

## Pubblicazione (GitHub Pages)

L'app è pubblicata su **https://my-beauty-collection.github.io/my-beauty-collection/**.
Il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) esegue test e build a ogni push su `main`
e pubblica `dist/`; si può rilanciare a mano da **Actions → Deploy su GitHub Pages → Run workflow**.

- Settings → Pages → Source: **GitHub Actions**.
- Settings → Secrets and variables → Actions → **Variables**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
  (la chiave publishable/anon è pubblica per natura: finisce comunque nel codice dell'app). Mai la secret key.

## Stack

- React 19 + TypeScript + Vite
- Interfaccia: [shadcn/ui](https://ui.shadcn.com) (stile "Nova", componenti Radix in `src/components/ui/`) + Tailwind CSS v4,
  icone lucide-react per l'interfaccia e icone beauty a tratto [IconOven](https://iconoven.com/icons) (licenza MIT)
  per categorie e tipologie: solo quelle usate, in [`src/components/beauty-icons.ts`](src/components/beauty-icons.ts). Lo stile riprende il prototipo "Beauty Collection UI"
  (rosa cipria, card bianche arrotondate, solo tema chiaro, font di sistema): palette in [`src/index.css`](src/index.css),
  mattoncini comuni (righe, card, schede, pillole) in [`src/components/common.tsx`](src/components/common.tsx).
  Per aggiungere un componente: `npx shadcn@latest add <nome>`.
- Supabase (Postgres + Auth) per i dati; Vitest per i test.
