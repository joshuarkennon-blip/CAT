# CAT asset providers (Pika, Spline, SVG)

CAT now supports multiple visual asset sources for the companion renderer.

## Supported providers

- `inline-svg` (default): built-in SVG cat and animation loop.
- `svg-url`: external SVG loaded via `<img>`.
- `video`: external video clip loaded via `<video>` (good for Pika renders).
- `spline`: Spline scene loaded via `<iframe>`.

If a provider fails (invalid URL, blocked frame, etc.), CAT falls back to `inline-svg`.

## Quick setup

The resolver reads config in this order:

1. URL query params
2. Stage data attributes
3. `window.CAT_ASSET_CONFIG` global
4. default `inline-svg`

### Supported attribute names

For a cat stage like `<div data-cat ...></div>`, these are supported:

- `data-cat-asset` / `data-cat-provider`
- `data-cat-src`
- `data-cat-idle-src`, `data-cat-attentive-src`, `data-cat-active-src`, `data-cat-celebratory-src`
- `data-cat-poster` (video)
- `data-cat-label`
- `data-cat-title` (Spline iframe title)

### Global configuration

Add this before your module script in `index.html` or `report.html`:

```html
<script>
  window.CAT_ASSET_CONFIG = {
    type: "video",
    src: "https://cdn.example.com/cat-loop.mp4",
    poster: "https://cdn.example.com/cat-poster.jpg",
    alt: "Companion cat video"
  };
</script>
```

### Query parameter override

Use this to test different assets quickly:

- `?catAsset=video&catSrc=https://cdn.example.com/cat.mp4`
- `?catAsset=spline&catSrc=https://my.spline.design/scene/`
- `?catAsset=svg-url&catSrc=https://cdn.example.com/cat.svg`

Optional params:

- `catPoster` for video poster image
- `catLabel` for accessibility label text
- `catTitle` for Spline iframe title

## Provider examples

### Pika video asset

```js
window.CAT_ASSET_CONFIG = {
  type: "video",
  src: "https://assets.example.com/pika/cat-loop.mp4",
  poster: "https://assets.example.com/pika/cat-loop-poster.jpg",
  alt: "Animated CAT companion clip"
};
```

### Spline embed

```js
window.CAT_ASSET_CONFIG = {
  type: "spline",
  src: "https://my.spline.design/your-scene/",
  title: "Interactive CAT companion scene"
};
```

### External SVG

```js
window.CAT_ASSET_CONFIG = {
  type: "svg-url",
  src: "https://assets.example.com/cat/companion.svg",
  alt: "CAT companion"
};
```

## Notes

- The built-in state machine (`idle`, `attentive`, `active`, `celebratory`) still runs.
- CSS state animations target inline SVG specifically; video/Spline/SVG URL providers can use `stateSources` to swap per-state assets.
- Programmatic usage supports per-state assets:

```js
mountCat(stage, {
  state: "idle",
  asset: {
    type: "video",
    stateSources: {
      idle: "/assets/cat-idle.mp4",
      attentive: "/assets/cat-look.mp4",
      active: "/assets/cat-work.mp4",
      celebratory: "/assets/cat-celebrate.mp4"
    }
  }
});
```
- Use HTTPS public URLs for hosted assets.
