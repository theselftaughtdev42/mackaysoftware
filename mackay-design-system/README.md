# Mackay Software — design system

Mackay Software Limited is a one-person software contracting company. The brand is minimal and technical: black on white, one red-orange accent, and one monospaced typeface. The mark is a terminal prompt: a chevron and a cursor. It exists mainly on invoices, quotes and letters, so every rule serves a printed A4 page first and a screen second.

## Voice

- Plain, precise, brief. "Backend development — 12 days", not "Delivering world-class solutions".
- British English, sentence case headings, no exclamation marks, no emoji.
- Amounts always with currency and two decimals: `£4,250.00`. Dates as `19 Sep 2026`.

## Visual foundations

- **Colour:** monochrome — `paper`, `ink`, `ink-muted`, `line`, `paper-sunken`. The only colour is `signal`, used at most twice per page (the logo's cursor, the amount due). Status badges pair `signal` text on `signal-soft`.
- **Type:** JetBrains Mono throughout — words, figures and labels alike — so every column aligns. Hierarchy comes from size, weight (400/600/700) and uppercase `label`s, never a second family. `display` is for the document title only.
- **Structure:** a 4px grid (`space-1` … `space-8`). Separate with `line` hairlines, never shadows or boxes. Corners are square (`radius-none`) except small controls.
- **Print:** always the light theme; 20mm margins; `signal` must stay legible in greyscale, so never rely on colour alone.

## Logo

The prompt mark (`>` chevron in `ink`, cursor bar in `signal`) beside **MACKAY SOFTWARE**, always uppercase, JetBrains Mono 600. Use the files in Logos: `ms-lockup` (default), `ms-mark` alone where space is tight (favicons, avatars), `-dark` versions on `ink`, `-mono` for single-colour print. Clear space: the chevron's height on every side. Never recolour, stretch or retype it.

## Invoice anatomy

Logo lockup top-left, about 24px tall, `display` "Invoice" top-right with `label`/`figure` pairs for number, date and due date. Bill-to block, then a line-item table (`paper-sunken` header row, `line` rules, figures right-aligned in `figure`). Totals band ends in `total` in `signal`. Payment details and company details in `small`, `ink-muted`, at the foot.

## Files

- `tokens.json` — source of truth for colour (light/dark), type, spacing and radius.
- `tokens.css` — CSS custom properties and `.t-*` type classes generated from it. Theme follows the OS, or force with `data-theme="light|dark"` on `<html>`.
- `logos/` — `ms-lockup` and `ms-mark`, each in default, `-dark` and `-mono`.

The type sizes are tuned for printed documents. For web pages, scale body up (16px+) and set responsive sizes before building.
