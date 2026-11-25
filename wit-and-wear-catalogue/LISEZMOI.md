# Wit & Wear Co. catalogue

Static English product catalogue for print-on-demand designs and one digital product. Customers choose a marketplace and complete checkout there; this site has no cart or listed prices.

## Refresh the catalogue

`build_catalogue.py` reads the product links CSV and the dated `mockups_gpt` manifests, matches products by design ID, and writes `produits.js` plus 800 px wide (maximum) JPEGs in `img/`.

```powershell
py -m pip install Pillow
py build_catalogue.py
```

Use `--csv`, `--mockups`, and `--output` if the source folders move. Rows without a marketplace link are ignored; linked designs without a matching manifest mockup are listed as skipped by the build report. If a `niche` or `category` field is added to the CSV or manifest, the site exposes a niche filter. Search always matches the quote and design ID.

## Digital product

The single entry lives in `digital.json`. Add the Gumroad listing URL to its `url` field when it is ready; a blank URL keeps the call-to-action inactive. No price is published here.

## Preview locally

```powershell
python -m http.server 8000
```

Open <http://127.0.0.1:8000/wit-and-wear-catalogue/> from the worktree root, or serve this directory directly and open <http://127.0.0.1:8000/>.
