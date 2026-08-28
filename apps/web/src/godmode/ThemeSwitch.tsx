import { Switch, useTheme } from '@heroui/react'
import { LuMoon, LuSun } from 'react-icons/lu'

/*
 * HeroUI's own theme controller: it writes the class and the data-theme
 * attribute to <html> and remembers the choice in localStorage. The docs are
 * firm that there is one per app and that it owns the root element, so this
 * does not try to scope the theme to the godmode subtree — HeroUI portals the
 * drawer, dropdowns and toasts to <body>, and a scoped theme would strand all
 * three on the other palette.
 *
 * The public pages stay dark by pinning data-theme on their own shell instead.
 * They render nothing through a portal, so pinning actually holds there.
 */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme('dark')
  const isLight = resolvedTheme === 'light'

  return (
    <Switch
      isSelected={isLight}
      onChange={(selected) => setTheme(selected ? 'light' : 'dark')}
      aria-label="Light theme"
      className="w-full rounded-lg px-3 py-2"
    >
      <Switch.Content className="w-full justify-between text-sm text-muted">
        <span className="flex items-center gap-3 font-medium">
          {isLight ? (
            <LuSun className="size-[18px] shrink-0" />
          ) : (
            <LuMoon className="size-[18px] shrink-0" />
          )}
          {isLight ? 'Light' : 'Dark'}
        </span>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  )
}
