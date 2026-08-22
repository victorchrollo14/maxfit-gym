import type { ReactNode } from 'react'
import { Button } from '@heroui/react'
import { LuMenu } from 'react-icons/lu'
import { useGodmode } from './context'

export function PageHeader({
  title,
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  const { openSidebar } = useGodmode()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Open menu"
        className="lg:hidden"
        onPress={openSidebar}
      >
        <LuMenu className="size-5" />
      </Button>
      <h1 className="display text-lg">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  )
}
