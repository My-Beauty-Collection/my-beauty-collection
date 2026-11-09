import { CloudOff, Heart, House, LayoutGrid, Menu, Plus, Settings, TriangleAlert, type LucideIcon } from 'lucide-react'
import { createElement, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Link, Row, RowList, Thumb } from './components/common'
import { getProductType, getSubcategory } from './data/taxonomy'
import { paths, useRoute, type ProductPrefill, type Route } from './router'
import { useStore } from './store'
import { ComboDetailView, CombosView } from './views/CombosView'
import { HomeView } from './views/HomeView'
import { CategoryPage, InventoryHome, OTHER_CATEGORY, SubcategoryPage } from './views/InventoryView'
import { ComboNewView, PairingsView } from './views/LipFlowViews'
import { CenteredCard, LoginView } from './views/LoginView'
import { ProductDetailView } from './views/ProductDetailView'
import { ProductFormView } from './views/ProductFormView'
import { SettingsView } from './views/SettingsView'
import { WarningsView } from './views/WarningsView'
import { WishlistView } from './views/WishlistView'

type Tab = 'home' | 'inventory' | 'add' | 'wishlist' | 'more'

function activeTab(route: Route): Tab {
  switch (route.name) {
    case 'home':
      return 'home'
    case 'inventory':
    case 'category':
    case 'subcategory':
    case 'product':
    case 'product-edit':
    case 'product-pairings':
    case 'combo-new':
      return 'inventory'
    case 'product-new':
      return 'add'
    case 'wishlist':
      return 'wishlist'
    case 'combos':
    case 'combo':
    case 'warnings':
    case 'settings':
      return 'more'
  }
}

/** Il "+" della barra apre un nuovo prodotto già nella categoria che stai guardando. */
function addPrefill(route: Route): ProductPrefill {
  if (route.name === 'category' && route.categoryId !== OTHER_CATEGORY) {
    const tab = getSubcategory(route.tab ?? '')
    return { categoryId: route.categoryId, subcategoryId: tab?.id }
  }
  if (route.name === 'subcategory') {
    return {
      categoryId: route.categoryId,
      subcategoryId: getSubcategory(route.subcategoryId) ? route.subcategoryId : undefined,
      typeId: getProductType(route.typeId)?.id,
    }
  }
  return {}
}

const navItemClass =
  'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] whitespace-nowrap text-[#766568] outline-none focus-visible:text-rose-ink'

function NavIcon({ icon, active, badge }: { icon: LucideIcon; active: boolean; badge?: number }) {
  return (
    <span className="relative">
      {createElement(icon, { className: 'size-[22px]', strokeWidth: active ? 2.2 : 1.7 })}
      {badge ? (
        <span className="absolute -top-1.5 -right-2.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </span>
  )
}

function NavLink({ to, icon, label, active }: { to: string; icon: LucideIcon; label: string; active: boolean }) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className={cn(navItemClass, active && 'font-bold text-rose-ink')}>
      <NavIcon icon={icon} active={active} />
      {label}
    </Link>
  )
}

/** Menu "Altro": le sezioni che non stanno nella barra. */
function MoreDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data, warnings } = useStore()
  const close = () => onOpenChange(false)
  const n = warnings.length
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-[430px] bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-left text-[21px] font-bold">Altro</DrawerTitle>
          <DrawerDescription className="sr-only">Altre sezioni dell'app</DrawerDescription>
        </DrawerHeader>
        <nav aria-label="Altre sezioni" className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={close}>
          <RowList>
            <Row
              to={paths.combos}
              media={<Thumb icon="lip-reading" className="h-12 w-12" />}
              title="Lip Combo"
              subtitle={`${data.combos.length} combo salvate`}
            />
            <Row
              to={paths.warnings}
              warn={n > 0}
              media={
                <Thumb className="h-12 w-12 bg-destructive/10 text-destructive-ink [&>svg]:size-6">
                  <TriangleAlert />
                </Thumb>
              }
              title="Scadenze e avvertenze"
              subtitle={n ? `${n} prodott${n === 1 ? 'o' : 'i'} con limite superato` : 'Nessun limite superato'}
            />
            <Row
              to={paths.settings}
              media={
                <Thumb className="h-12 w-12 [&>svg]:size-6">
                  <Settings />
                </Thumb>
              }
              title="Impostazioni"
              subtitle="Profilo, backup e dati"
            />
          </RowList>
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

function BottomNav({ route }: { route: Route }) {
  const { warnings } = useStore()
  const [moreOpen, setMoreOpen] = useState(false)
  const tab = activeTab(route)

  return (
    <>
      <nav
        aria-label="Sezioni"
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex h-(--nav-h) items-stretch justify-around px-0.5 pt-1.5 pb-1">
          <NavLink to={paths.home} icon={House} label="Home" active={tab === 'home'} />
          <NavLink to={paths.inventory} icon={LayoutGrid} label="Inventario" active={tab === 'inventory'} />
          <div className="flex flex-1 items-center justify-center">
            <Link
              to={paths.productNew(addPrefill(route))}
              aria-label="Aggiungi un prodotto"
              aria-current={tab === 'add' ? 'page' : undefined}
              className="grid size-12 -translate-y-1 place-items-center rounded-full bg-primary text-primary-foreground shadow-float outline-none focus-visible:ring-3 focus-visible:ring-ring active:scale-95"
            >
              <Plus className="size-6" strokeWidth={2.4} />
            </Link>
          </div>
          <NavLink to={paths.wishlist} icon={Heart} label="Wishlist" active={tab === 'wishlist'} />
          <button
            type="button"
            className={cn(navItemClass, tab === 'more' && 'font-bold text-rose-ink')}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
          >
            <NavIcon icon={Menu} active={tab === 'more'} badge={warnings.length} />
            Altro
          </button>
        </div>
      </nav>
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  )
}

function SyncIndicator() {
  const { sync, syncError, retry } = useStore()
  if (sync === 'saved') return null
  return (
    <div
      role={sync === 'error' ? 'alert' : 'status'}
      className={cn(
        'fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap shadow-card',
        sync === 'saving' ? 'text-muted-foreground' : 'border-destructive/30 text-destructive-ink',
      )}
    >
      {sync === 'saving' ? (
        <>
          <Spinner className="size-3.5" /> Salvataggio…
        </>
      ) : (
        <>
          <CloudOff className="size-4" />
          <span title={syncError ?? undefined}>Modifiche non salvate</span>
          <button type="button" className="font-bold underline underline-offset-2" onClick={retry}>
            Riprova
          </button>
        </>
      )}
    </div>
  )
}

export default function App() {
  const { auth, retry, signOut } = useStore()

  let screen: ReactNode
  switch (auth.status) {
    case 'loading':
      screen = (
        <div className="mx-auto grid min-h-dvh max-w-[430px] place-items-center bg-background">
          <Spinner className="size-7 text-primary" aria-label="Caricamento" />
        </div>
      )
      break
    case 'signed-out':
      screen = <LoginView />
      break
    case 'load-error':
      screen = (
        <CenteredCard>
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive-ink">
              <CloudOff className="size-7" />
            </span>
            <h1 className="text-[21px] font-bold">Impossibile caricare i dati</h1>
            <p className="mt-2 text-[13px] break-words text-muted-foreground">{auth.message}</p>
            <div className="mt-6 flex w-full flex-col gap-2">
              <Button size="lg" onClick={retry}>
                Riprova
              </Button>
              <Button variant="outline" size="lg" onClick={() => void signOut()}>
                Esci
              </Button>
            </div>
          </div>
        </CenteredCard>
      )
      break
    default:
      screen = <MainApp />
  }

  return (
    <>
      {screen}
      <Toaster position="top-center" richColors closeButton duration={2500} />
    </>
  )
}

function MainApp() {
  const route = useRoute()
  // Ricerca dell'inventario tenuta qui per non perderla quando si apre un prodotto e si torna indietro.
  const [query, setQuery] = useState('')

  let view: ReactNode
  switch (route.name) {
    case 'home':
      view = <HomeView />
      break
    case 'inventory':
      view = <InventoryHome query={query} setQuery={setQuery} />
      break
    case 'category':
      view = <CategoryPage key={route.categoryId} categoryId={route.categoryId} tab={route.tab} />
      break
    case 'subcategory':
      view = (
        <SubcategoryPage
          key={`${route.subcategoryId}/${route.typeId}`}
          categoryId={route.categoryId}
          subcategoryId={route.subcategoryId}
          typeId={route.typeId}
        />
      )
      break
    case 'product':
      view = <ProductDetailView key={route.id} id={route.id} tab={route.tab} />
      break
    case 'product-new':
      view = (
        <ProductFormView key={`new-${JSON.stringify(route.prefill)}`} mode={{ kind: 'new', prefill: route.prefill }} />
      )
      break
    case 'product-edit':
      view = <ProductFormView key={`edit-${route.id}`} mode={{ kind: 'edit', id: route.id }} />
      break
    case 'product-pairings':
      view = <PairingsView key={route.id} id={route.id} />
      break
    case 'combo-new':
      view = <ComboNewView key={route.linerId} linerId={route.linerId} />
      break
    case 'combos':
      view = <CombosView />
      break
    case 'combo':
      view = <ComboDetailView key={route.id} id={route.id} />
      break
    case 'warnings':
      view = <WarningsView />
      break
    case 'wishlist':
      view = <WishlistView />
      break
    case 'settings':
      view = <SettingsView />
      break
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[430px] bg-background shadow-[0_0_40px_rgb(126_69_83/6%)]">
      <main className="px-4 pt-[max(22px,env(safe-area-inset-top))] pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+24px)]">
        {view}
      </main>
      <BottomNav route={route} />
      <SyncIndicator />
    </div>
  )
}
