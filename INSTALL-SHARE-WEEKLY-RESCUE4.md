# Share cards + Weekly board + RESCUE 04 + Cosmetics

## 1. Supabase
SQL Editor → run `upgrade-gamezone-weekly.sql`
(Requires `upgrade-gamezone.sql` already applied.)

## 2. public/lab/ — copy these files
- share.js
- cosmetics.js
- rescue.js (updated — Mission 04)
- gamezone.js (weekly section)
- gamezone.css

## 3. public/lab/index.html — scripts (before gamezone.js)
```html
<script src="cosmetics.js"></script>
<script src="share.js"></script>
<script src="rescue.js"></script>
<script src="gztrack.js"></script>
<script src="gamezone.js"></script>
```

## 4. src/pages/Lab.jsx
Replace with the updated Lab.jsx (handles gamezoneboardweek).

## 5. Test
- Clear any Game Zone mission → share modal appears
- Admin / profile dropdown → This week Top 10
- RESCUE → Mission 04 Phantom Trace
