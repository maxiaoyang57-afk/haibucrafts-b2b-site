# Inquiry intent and contact preference — 2026-09-29

## Buyer experience

Email remains the default. Buyers can ask about pricing, samples, custom development, product selection or repeat orders and select Email or WhatsApp for follow-up. The existing form still requires email; a direct WhatsApp link is available for buyers who prefer not to fill out the form. The choice is a staff follow-up preference, not an automated WhatsApp delivery integration.

Buying stage and first priority are optional and collapsed initially. Unknown quantities are welcome; selecting a goal changes guidance without overwriting buyer notes. WhatsApp follow-up requires a number with + and country code. Product/SKU, topic and source page travel with the inquiry. Personal form contents are not copied into external link URLs.

| Entry | CTA / guidance |
| --- | --- |
| Specific product | Ask about this product; pricing, samples or a custom version |
| Product category | Find the right products; styles, use and selection help |
| Custom / private label | Discuss your design; an idea or reference image is enough to start |
| Buyer guide | Get sourcing advice; what question remains after reading? |
| Seasonal collection | Plan your collection; theme and target arrival date |
| Factory / quality | Discuss your requirements; supply, packaging, quality or documentation |
| General | Tell us what you need; prices, samples, design or selection |

The shared script updates generic main-page CTAs while preserving navigation labels and existing SKU-specific buttons. Direct email and WhatsApp openers include the page/topic. Generator templates retain the shared script on future product builds.

## Reception workflow

Read inquiry_goal, preferred_contact, buying_stage and first_priority before replying. Answer the buyer's stated first question; ask only for the one or two missing details needed for the next step. For a sample request, discuss samples before a bulk-order questionnaire. Use WhatsApp only when selected or requested. An email-first buyer can be offered WhatsApp as an optional convenience.

Do not treat all lost replies as a channel problem. Compare second-reply rate, time to first useful response, sample progression and quote progression by goal and preferred channel. This change does not promise increased conversion.

## Verification

- Six form variants and four entry contexts passed isolated DOM checks: selected goal serialization, notes preserved, WhatsApp validation, switching back to email, contextual links and no personal form text in direct-link URLs.
- HAIBU: 35 targeted tests passed, including mocked primary/backup delivery, attachment behavior, accepted-only conversion, buyer intent and reply preference in delivered content.
- QULA: recipient/backup and native multipart guards, protected products, SEO, IndexNow, full page gates and inquiry basket synchronization passed.
- No live inquiry, customer message or real email was sent during testing. Inbox delivery and actual business follow-up were not end-to-end tested.

Preview branch only; production changes require review and merge.
