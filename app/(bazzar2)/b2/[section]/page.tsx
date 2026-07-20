import { notFound } from 'next/navigation'
import { B2_SECTION_KEYS, b2Label } from '@/components/bazzar2/sections'
import {
  loadOverview, loadSales, loadRegistrations, loadFinance, loadTeam,
  loadActivity, loadSubscriptions, loadCatalogExtras, loadUsers, loadArticles,
} from '@/lib/bazzar2/load'
import { UsersSection } from '@/components/bazzar2/UsersSection'
import { BlogSection } from '@/components/bazzar2/BlogSection'
import { OverviewSection } from '@/components/bazzar2/OverviewSection'
import { SalesSection } from '@/components/bazzar2/SalesSection'
import { RegistrationsSection } from '@/components/bazzar2/RegistrationsSection'
import { FinanceSection } from '@/components/bazzar2/FinanceSection'
import { TeamSection } from '@/components/bazzar2/TeamSection'
import { ReputationSection } from '@/components/bazzar2/ReputationSection'
import { CatalogSection } from '@/components/bazzar2/CatalogSection'
import { SubscriptionsSection } from '@/components/bazzar2/SubscriptionsSection'
import { ActivitySection } from '@/components/bazzar2/ActivitySection'
import { B2Embed } from '@/components/bazzar2/B2Embed'
import { BazzarAnalyticsPanel } from '@/components/projects/ProjectDetail/BazzarAnalyticsPanel'

export const dynamic = 'force-dynamic'

/** Роутер разделов BazzarSerts 2.0 — все 11 разделов. */
export default async function B2SectionPage({ params }: { params: { section: string } }) {
  const { section } = params
  if (!B2_SECTION_KEYS.includes(section)) notFound()

  switch (section) {
    case 'overview': {
      const data = await loadOverview()
      return <OverviewSection data={data} />
    }
    case 'sales': {
      const { certs, manual } = await loadSales()
      return <SalesSection certs={certs} manual={manual} />
    }
    case 'registrations': {
      const { certs, manual } = await loadRegistrations()
      return <RegistrationsSection certs={certs} manual={manual} />
    }
    case 'catalog': {
      const { apps, products, variants, variantsReady } = await loadCatalogExtras()
      return <CatalogSection apps={apps} products={products} variants={variants} variantsReady={variantsReady} />
    }
    case 'subscriptions': {
      const { subs, apps, ready } = await loadSubscriptions()
      return <SubscriptionsSection subs={subs} apps={apps} ready={ready} />
    }
    case 'users': {
      const { users, certs, subs, tickets, manual } = await loadUsers()
      return <UsersSection users={users} certs={certs} subs={subs} tickets={tickets} manual={manual} />
    }
    case 'reputation':
      return <ReputationSection />
    case 'analytics':
      return (
        <B2Embed title="Аналитика">
          <BazzarAnalyticsPanel />
        </B2Embed>
      )
    case 'finance': {
      const { certs, tx } = await loadFinance()
      return <FinanceSection certs={certs} tx={tx} />
    }
    case 'team': {
      const { projectId, members, tasks, allUsers } = await loadTeam()
      return <TeamSection projectId={projectId} members={members} tasks={tasks} allUsers={allUsers} />
    }
    case 'activity': {
      const { logs, users } = await loadActivity()
      return <ActivitySection logs={logs} users={users} />
    }
    case 'blog': {
      const { articles } = await loadArticles()
      return <BlogSection articles={articles} />
    }
    default:
      return (
        <B2Embed title={b2Label(section)}>
          <div className="card p-10 text-center text-mute">Раздел в разработке.</div>
        </B2Embed>
      )
  }
}
