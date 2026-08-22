import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Button,
  Chip,
  Dropdown,
  Label,
  Modal,
  Spinner,
  Table,
  Toast,
} from '@heroui/react'
import {
  LuBan,
  LuCopy,
  LuEllipsisVertical,
  LuPlus,
  LuRefreshCw,
  LuUndo2,
  LuX,
} from 'react-icons/lu'
import { getSupabase } from '../lib/supabase'
import { useGodmode } from './context'
import { PageHeader } from './PageHeader'
import { CLAIMS, activeClaims, hasClaim } from './session'

type InternalUser = {
  id: string
  email: string | null
  name: string
  created_at: string
  last_sign_in_at: string | null
  app_metadata: Record<string, unknown>
  banned_until: string | null
}

const isBanned = (user: InternalUser) =>
  !!user.banned_until && new Date(user.banned_until).getTime() > Date.now()

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

export function Claims() {
  const { session } = useGodmode()
  const navigate = useNavigate()
  const [users, setUsers] = useState<InternalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingBan, setPendingBan] = useState<InternalUser | null>(null)

  const allowed = hasClaim(session, 'claims_admin')

  useEffect(() => {
    if (!allowed) navigate({ to: '/godmode', replace: true })
  }, [allowed, navigate])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getSupabase().rpc('get_internal_users')
    if (error) {
      console.error('get_internal_users failed', error)
      Toast.toast.danger('Could not load staff.')
    }
    setUsers((data as InternalUser[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (allowed) load()
  }, [allowed, load])

  /* Every one of these returns 'OK' or an 'error: …' string rather than
     throwing, so a successful round trip can still be a refusal. */
  const call = async (fn: string, args: Record<string, unknown>, done: string) => {
    const { data, error } = await getSupabase().rpc(fn, args)
    if (error) {
      console.error(`${fn} failed`, error)
      Toast.toast.danger('Something went wrong.')
      return
    }
    if (data !== 'OK') {
      Toast.toast.danger(String(data).replace(/^error:\s*/, ''))
      return
    }
    Toast.toast.success(done)
    load()
  }

  const addClaim = (uid: string, claim: string) =>
    call('set_claim', { uid, claim, value: true }, `${claim} granted`)

  const removeClaim = (uid: string, claim: string) =>
    call('delete_claim', { uid, claim }, `${claim} removed`)

  const setBanned = (uid: string, banned: boolean) =>
    call(
      'set_internal_user_banned',
      { uid, banned },
      banned ? 'User disabled' : 'User re-enabled',
    )

  if (!allowed) return null

  return (
    <>
      <PageHeader
        title="Claims"
        actions={
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Refresh"
            isPending={loading}
            onPress={load}
          >
            <LuRefreshCw className="size-4" />
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <p className="text-sm text-pretty text-muted">
          Staff accounts are created in the Supabase dashboard under Auth → Users.
          They show up here once they exist, and a claim only reaches them on their
          next sign-in or session refresh.
        </p>

        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Staff accounts">
              <Table.Header>
                <Table.Column id="email" isRowHeader>
                  EMAIL
                </Table.Column>
                <Table.Column id="claims">CLAIMS</Table.Column>
                <Table.Column id="last">LAST SIGN IN</Table.Column>
                <Table.Column id="created">CREATED</Table.Column>
                <Table.Column id="actions">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body
                items={users}
                renderEmptyState={() =>
                  loading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">
                      No staff accounts yet.
                    </p>
                  )
                }
              >
                {(user: InternalUser) => {
                  const active = activeClaims(user.app_metadata)
                  const available = CLAIMS.filter((claim) => !active.includes(claim))
                  const banned = isBanned(user)

                  return (
                    <Table.Row key={user.id} id={user.id}>
                      <Table.Cell>
                        <span className={banned ? 'text-muted line-through' : 'font-medium'}>
                          {user.email ?? user.id}
                        </span>
                        {user.name && (
                          <span className="block text-xs text-muted">{user.name}</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex max-w-md flex-wrap items-center gap-1">
                          {active.map((claim) => (
                            <Chip key={claim} size="sm" variant="soft" color="success">
                              {claim}
                              <button
                                type="button"
                                aria-label={`Remove ${claim}`}
                                onClick={() => removeClaim(user.id, claim)}
                                className="ml-1 cursor-pointer hover:text-danger"
                              >
                                <LuX className="size-3" />
                              </button>
                            </Chip>
                          ))}
                          {active.length === 0 && (
                            <span className="text-sm text-muted">None</span>
                          )}
                          {available.length > 0 && (
                            <Dropdown>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label="Add claim"
                                className="size-6 min-w-6"
                              >
                                <LuPlus className="size-3" />
                              </Button>
                              <Dropdown.Popover>
                                <Dropdown.Menu
                                  aria-label="Add claim"
                                  onAction={(key) => addClaim(user.id, String(key))}
                                >
                                  {available.map((claim) => (
                                    <Dropdown.Item key={claim} id={claim} textValue={claim}>
                                      <Label>{claim}</Label>
                                    </Dropdown.Item>
                                  ))}
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-muted">
                          {formatDate(user.last_sign_in_at)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-muted">
                          {formatDate(user.created_at)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Dropdown>
                          <Button isIconOnly size="sm" variant="ghost" aria-label="Actions">
                            <LuEllipsisVertical className="size-4" />
                          </Button>
                          <Dropdown.Popover>
                            <Dropdown.Menu
                              aria-label="User actions"
                              disabledKeys={user.id === session.user.id ? ['ban'] : undefined}
                              onAction={async (key) => {
                                if (key === 'copy') {
                                  await navigator.clipboard.writeText(user.id)
                                  Toast.toast.success('User ID copied')
                                }
                                if (key === 'ban') {
                                  if (banned) setBanned(user.id, false)
                                  else setPendingBan(user)
                                }
                              }}
                            >
                              <Dropdown.Item id="copy" textValue="Copy user ID">
                                <LuCopy className="size-4" />
                                <Label>Copy user ID</Label>
                              </Dropdown.Item>
                              <Dropdown.Item
                                id="ban"
                                textValue={banned ? 'Re-enable user' : 'Disable user'}
                                className={banned ? undefined : 'text-danger'}
                              >
                                {banned ? (
                                  <LuUndo2 className="size-4" />
                                ) : (
                                  <LuBan className="size-4" />
                                )}
                                <Label>{banned ? 'Re-enable user' : 'Disable user'}</Label>
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  )
                }}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <Modal.Backdrop
        isOpen={!!pendingBan}
        onOpenChange={(open) => {
          if (!open) setPendingBan(null)
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Disable this account?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-pretty text-muted">
                {pendingBan?.email} will not be able to sign in. Their claims stay
                as they are, and you can re-enable them from this screen.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setPendingBan(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-danger text-danger-foreground"
                onPress={() => {
                  if (pendingBan) setBanned(pendingBan.id, true)
                  setPendingBan(null)
                }}
              >
                Disable
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  )
}
