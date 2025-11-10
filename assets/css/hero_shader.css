/* ==========================================================
   Shader Hero — confined to banner, text aligned to wrapper
   ========================================================== */

/* Reuse the theme’s content width for perfect left alignment */
:root {
  --content-width:  var(--yat-content-width, 920px); /* theme fallback */
  --banner-height:  clamp(320px, 48vh, 560px);
}

/* The banner box that holds both the shader and the text */
.page-banner {
  position: relative;
  display: block;
  height: var(--banner-height);
  background: transparent;                 /* no solid color behind */
  overflow: hidden;                         /* clip shader to band */
  isolation: isolate;                       /* be safe with z-index */
}

/* The WebGL canvas fills the banner area only */
.page-banner .shader-fill {
  position: absolute;
  inset: 0;
  pointer-events: none;                     /* don’t steal mouse */
  z-index: 0;
}
.page-banner .shader-fill canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Text block inside the banner:
   - same max width and horizontal centering as .wrapper
   - left-aligned text, docked near the bottom for the hero feel
*/
.page-banner .page-banner-inner {
  position: relative;
  z-index: 1;
  max-width: var(--content-width);
  margin: 0 auto;                           /* centers block */
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;                /* sit near bottom */
  align-items: flex-start;                  /* LEFT align */
  padding: 2.25rem 1rem;                    /* match wrapper gutter */
  text-align: left;
}

.page-banner .page-title {
  margin: 0 0 .3rem 0;
  line-height: 1.15;
}

.page-banner .page-subtitle {
  margin: 0;
  opacity: .9;
}

/* Keep header above the banner visuals */
.site-header { position: relative; z-index: 5; }

/* Small screens: slightly shorter banner */
@media (max-width: 720px) {
  :root { --banner-height: clamp(240px, 40vh, 420px); }
}
