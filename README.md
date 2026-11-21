# Huntly

Huntly landing page — an adaptive dog foraging tower.

## How to run

Open `index.html` in a browser, or run a local server:

```bash
# Python 3
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Deployment

The site is deployed on Vercel at:
https://2131872-hwa-hackathon.vercel.app

To redeploy after changes:

```bash
git add .
git commit -m "your message"
git push origin main
vercel --prod
```

## Swapping in your own images

Replace the placeholder files under `/images`:

- `images/hero.jpg` — hero section tower image
- `images/lifestyle.jpg` — product gallery image

Drop your own images into the `images/` folder with the same filenames. If an image is missing, the alt text and fallback styling will show instead.

## Cart

The cart lives in `localStorage` (key `huntly_cart`), so items persist across reloads. Prices are in Indian rupees (₹). Shipping is free over ₹5,000, otherwise ₹149.
