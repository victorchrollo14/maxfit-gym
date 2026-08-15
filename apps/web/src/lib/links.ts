import { gym } from '../content'

/** `wa.me` deep link with the first message pre-typed for the sender. */
export function whatsappHref(message: string) {
  return `https://wa.me/${gym.whatsapp}?text=${encodeURIComponent(message)}`
}

export const telHref = `tel:${gym.phone.replace(/\s/g, '')}`
