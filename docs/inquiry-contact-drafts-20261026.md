# Inquiry page contact draft consistency

The production quote page previously copied the current requirements into its two in-form contact links only. The header, footer, floating WhatsApp action and introductory “Chat with sales” link retained generic messages. This was reproduced on production with synthetic product, SKU, quantity and question values, without opening a messaging app or submitting an inquiry.

Every link to the existing sales email or WhatsApp number on the inquiry page now uses the current form draft. Input/change events update them together, and clicking any entry refreshes values restored without an input event. Product-list quantities use the existing form rows. Contact fields continue to be excluded from these drafts; no tracking events, recipient changes or commercial claims are added. Other pages retain their existing product/guide messages.

The authoritative preview script is materialized into production. Only the quote page script query version changes, so returning buyers receive the fix.

Validation: 260 Node tests pass, release and content/IP audits pass (383 HTML pages, 381 indexable URLs), and 462 materialized files match production source. The browser regression now checks every page-wide contact entry at 360 and 1180 px, edited/cleared fields, click-time restored values and changing/removing multi-product quantities. External delivery is blocked during browser tests. The GitHub release gate supplies the browser runtime because local browser installation could not download a valid archive.
