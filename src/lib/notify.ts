export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission !== 'granted') return
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vibrate: _v, ...rest } = (options || {}) as any
  new Notification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...rest,
  })
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
