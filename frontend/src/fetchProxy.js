const _fetch = window.fetch.bind(window)
const CIRCLE_BASE = 'https://api.circle.com/v1/stablecoinKits'
const PROXY_BASE = '/api/circle'

window.fetch = (input, init = {}) => {
  // Extrai a URL independente do tipo de input (string, URL object ou Request)
  let rawUrl

  if (typeof input === 'string') {
    rawUrl = input
  } else if (input instanceof Request) {
    rawUrl = input.url
  } else {
    rawUrl = String(input)
  }

  if (!rawUrl.startsWith(CIRCLE_BASE)) {
    return _fetch(input, init)
  }

  const proxied = rawUrl.replace(CIRCLE_BASE, PROXY_BASE)
  console.log('[fetchProxy]', rawUrl.split('?')[0], '→', proxied.split('?')[0])

  // Se o input era um Request object, reconstrói com a nova URL
  // para preservar method, headers e body do Request original
  if (input instanceof Request) {
    return _fetch(new Request(proxied, input))
  }

  return _fetch(proxied, init)
}
