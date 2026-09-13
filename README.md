# Star Garden: Make Ten

Interactive education lesson (age ~6) for Taskmarket bounty TSK-B1MHHF16 / 0x2a5807fef94f387afdd23c9b9529e50c809fae97004c988ce96efda3c92aa73c.

## Preview

Public HTTPS preview (GitHub Pages): https://dhishwasher.github.io/star-garden-make-ten/

## Run locally

No build step. Any static server:

```bash
python3 -m http.server 8080 --directory src
# open http://127.0.0.1:8080/
```

Or open `src/index.html` directly in a modern browser.

## Tests

```bash
python3 tests/domain_test.py
```

## Stack

Plain HTML/CSS/JS. No CDN, no network calls, no analytics, no login.

## License

MIT — see LICENSE.
