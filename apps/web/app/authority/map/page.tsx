// apps/web/app/authority/map/page.tsx

import dynamic from "next/dynamic"

const AuthorityMapView = dynamic(
  () => import("./_components/AuthorityMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#b4725a] border-t-transparent" />
          <p className="text-sm text-gray-400">Loading map…</p>
        </div>
      </div>
    ),
  }
)

export default function AuthorityMapPage() {
  return <AuthorityMapView />
}
