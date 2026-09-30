# Simplified inquiry preview — 2026-09-29

User-approved direction: a question plus one chosen reply address; other details optional. Replaces the earlier preference-heavy preview, without changing production.

- Removed inquiry-goal, buying-stage and priority dropdowns.
- Required question plus email (default) or international WhatsApp number; inactive contact input is hidden and disabled, retaining its value if the buyer switches back.
- Name, company, country, quantity and specification fields grouped under a single optional disclosure.
- Reference attachments, automatic product/SKU/source capture and inquiry lists retained.
- HAIBU simple-mode API validation accepts phone-only requests and omits an empty Reply-To; legacy validation remains compatible.
- QULA keeps the existing native multipart FormSubmit action and backup recipient. No actual inquiry was sent during verification.

Validation: six isolated form flows including source-preview; HAIBU 158 tests passed including phone-only/email-only delivery mocks and invalid/empty request rejection; QULA recipient/backup, native attachment, protected catalog, SEO, IndexNow and basket gates passed. Browser preview reviewed separately.

## Revised presentation after buyer feedback

Centered single card on dedicated inquiry pages; reduced hero height; QULA sidebar removed, custom scope retained below the form in an optional disclosure. Email/WhatsApp use two directly selectable buttons with synchronized required contact fields; native select retained as no-JS fallback. No change to delivery endpoints or validation.
