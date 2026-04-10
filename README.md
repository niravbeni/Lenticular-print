# Lenticular Print Generator

A client-side web app that interlaces multiple images into a print-ready lenticular output. Upload your images, set the LPI of your lens sheet and DPI of your printer, generate the interlaced image, and download it as PNG or TIFF with embedded DPI metadata.

## How it works

A lenticular lens sheet has tiny cylindrical lenses at a fixed pitch (LPI). This tool slices your source images into alternating vertical strips — one per frame per lens — so that each lens reveals a different image depending on the viewing angle.

**Strip width** = DPI / LPI / number of frames

## Features

- Upload 2+ images for flip or animation effects
- Configurable LPI and DPI with common presets
- Fractional strip width handling (no rounding drift)
- Mismatched image dimensions auto-cropped to match
- Zoomable preview with optional strip overlay
- Export as PNG (with pHYs DPI metadata) or TIFF (with resolution tags)
- Fully client-side — no server, no uploads, your images stay local

## Getting started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/` — deploy anywhere that serves static files.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Canvas API for interlacing
- `changedpi` for PNG DPI metadata
- `utif` for TIFF encoding
