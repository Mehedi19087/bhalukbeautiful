# Domain migration check

Checked on 7 November 2026 at about 5:28 PM Bangladesh time.

## Result

The Vercel deployment works. The domain change is not visible on every tested DNS service yet.

| Check | Result |
| --- | --- |
| `.com` registry nameservers | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Vercel verification for root and www | Valid, verified, no conflicts |
| Google DNS over HTTPS and `8.8.8.8` | Vercel addresses |
| Cloudflare DNS | Vercel addresses |
| Google `8.8.4.4` | Old address: `144.79.219.130` |
| Local network DNS | Old address: `144.79.219.130` |
| Old nameservers `bdix1.webrserver.com` and `bdix2.webrserver.com` | Old address: `144.79.219.130` |
| Normal browser visit to root | Old WordPress site, LiteSpeed server |
| Normal browser visit to www | New React site, Vercel server |
| Root sent directly to Vercel, with normal HTTPS certificate checks | HTTP 200, new React site |

The root, www, and default Vercel address serve the same frontend assets when requests reach Vercel. The root was tested with `curl --resolve digontonews.com:443:216.198.79.1 https://digontonews.com/`.

Clearing the local system DNS cache did not fix the upstream old answer. No DNS records or deployment settings were changed during this check.

## Immediate working address

https://www.digontonews.com/

Fallback: https://bhalukbeautiful.vercel.app/

## Support request for PutulHost

Subject: Urgent help with old hosting during digontonews.com migration

We moved digontonews.com to Vercel. The registry now lists ns1.vercel-dns.com and ns2.vercel-dns.com. Vercel verifies both the root and www domains.

Some DNS services still return 144.79.219.130. That server still serves the old WordPress website. We do not have access to the old hosting.

Do you manage that server or the old DNS zone? If yes, please help with these changes:

1. Add a temporary HTTP 302 redirect on the old server for digontonews.com and www.digontonews.com to https://bhalukbeautiful.vercel.app/. Apply it before WordPress rules and clear the old web cache. This helps visitors whose DNS still points to the old server.
2. Update the old DNS zone on bdix1.webrserver.com and bdix2.webrserver.com, if you control it. Replace the old root website A record with 216.198.79.1 and 64.29.17.1. Set www to CNAME 7795db5a4a1a2510.vercel-dns-017.com. Remove conflicting website records for these two names only. This helps resolvers that still use the old nameservers after their address cache expires.
3. Keep the current Vercel nameservers. Keep the old files, database, and unrelated records. Please do not cancel the old hosting during this transition.

If you do not manage the old server, please help identify the hosting provider or account that can make the redirect.

## Limits

This request has been prepared, not sent. We do not have old-hosting access.

A Vercel change cannot redirect requests that still reach the old server. Deleting and adding the root record again will not clear caches held by other DNS services. No exact worldwide completion time can be promised.

Google documents stale answers after nameserver changes: https://developers.google.com/speed/public-dns/docs/troubleshooting#returning-the-wrong-answers-for-a-domain

Vercel domain troubleshooting: https://vercel.com/docs/domains/troubleshooting
