import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, User, Image as ImageIcon, FileText } from 'lucide-react'
import { updateProfile } from '@/app/actions'

export default async function EditProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { profile: true },
  })

  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center gap-4">
        <Link href={`/profile/${user.username}`}
          className="brutalist-btn bg-white text-black px-4 py-2 text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
      </div>

      <div className="border-b-[6px] border-black pb-6">
        <p className="font-mono text-xs uppercase text-black/40 font-black mb-1">User_Profile · UPDATE</p>
        <h1 className="font-headline font-black text-6xl uppercase tracking-tighter leading-[0.85]">
          Edit<br />Profile
        </h1>
      </div>

      <div className="brutalist-card bg-[#fdf9ee] overflow-hidden">
        <div className="h-4 bg-[#363cff] border-b-[3px] border-black" />
        <form action={updateProfile} className="p-8 space-y-6">
          <div>
            <label className="block font-mono font-black text-xs uppercase mb-2 text-black/70">Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input name="display_name" type="text" defaultValue={user.profile?.display_name || ''}
                className="w-full bg-white border-[3px] border-black font-mono text-sm pl-12 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-black placeholder:text-black/20"
                placeholder="Your display name" />
            </div>
          </div>

          <div>
            <label className="block font-mono font-black text-xs uppercase mb-2 text-black/70">Bio</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-4 h-4 text-black/30" />
              <textarea name="bio" rows={4} defaultValue={user.profile?.bio || ''}
                className="w-full bg-white border-[3px] border-black font-mono text-sm pl-12 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-black placeholder:text-black/20 normal-case"
                placeholder="Tell us about yourself..." />
            </div>
          </div>

          <div>
            <label className="block font-mono font-black text-xs uppercase mb-2 text-black/70">Profile Image URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
              <input name="profile_image_url" type="url" defaultValue={user.profile?.profile_image_url || ''}
                className="w-full bg-white border-[3px] border-black font-mono text-sm pl-12 pr-4 py-3 focus:outline-none focus:ring-0 focus:border-black placeholder:text-black/20"
                placeholder="https://example.com/avatar.jpg" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t-[3px] border-black">
            <button type="submit"
              className="flex-1 brutalist-btn bg-[#363cff] text-white py-4 text-sm flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
            <Link href={`/profile/${user.username}`}
              className="brutalist-btn bg-white text-black px-8 py-4 text-sm flex items-center justify-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
