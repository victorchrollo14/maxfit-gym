import { CtaPair } from './CtaPair'

/**
 * Mobile-only persistent CTA. The page is long, so this recovers people who
 * scroll past the hero form.
 */
export function StickyCta() {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <CtaPair location="sticky_bar" size="md" layout="row" fill />
    </div>
  )
}
