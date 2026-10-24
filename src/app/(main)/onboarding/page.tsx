import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [cuisines, restrictions] = await Promise.all([
    prisma.cuisine.findMany({ orderBy: { cuisine_name: 'asc' }, select: { cuisine_name: true } }),
    prisma.dietary_Restriction.findMany({ orderBy: { restriction_name: 'asc' }, select: { restriction_name: true } }),
  ])

  return (
    <OnboardingClient
      cuisines={cuisines.map(c => c.cuisine_name)}
      restrictions={restrictions.map(r => r.restriction_name)}
    />
  )
}
