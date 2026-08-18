import { PublicShell } from './PublicShell'

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell>{children}</PublicShell>
}
