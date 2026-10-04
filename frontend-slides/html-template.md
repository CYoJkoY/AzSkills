# HTML Presentation Template

Reference architecture for production-quality fixed-stage HTML presentations. Author every slide at 1920×1080 and scale the complete stage uniformly to the viewport.

## Recommended Document Shape

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#F5F3EC">
  <title>Presentation</title>
  <style>
    :root {
      /* AzSkills Wabi-Press (侘寂刊本) default visual system — light washi spectrum.
         Token source: ../design-system/wabi-press.css. Do not fork. */
      --stage-bg: #F5F3EC;
      --slide-bg: #FAF9F5;
      --color-surface-overlay: #ECE8DC;
      --color-hairline: rgba(40, 36, 32, 0.10);
      --color-hairline-strong: rgba(40, 36, 32, 0.25);
      --color-text: #1C1A17;
      --color-text-secondary: #524C44;
      --color-text-muted: #878074;
      --color-cinnabar: #A6382A;
      --color-moss: #3B5848;
      --font-display: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", Georgia, serif;
      --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "JetBrains Mono", SFMono-Regular, Menlo, monospace;
      --ease-paper: cubic-bezier(0.25, 1, 0.4, 1);
      --ease-ink: cubic-bezier(0.16, 1, 0.3, 1);
      --duration-normal: 0.28s;
      --stage-padding-x: 112px;
      --stage-padding-y: 96px;
    }

    [data-theme="dark"] {
      --stage-bg: #131416;
      --slide-bg: #1B1C20;
      --color-surface-overlay: #25272D;
      --color-hairline: rgba(240, 235, 225, 0.08);
      --color-hairline-strong: rgba(240, 235, 225, 0.18);
      --color-text: #EDEAE2;
      --color-text-secondary: #A39F95;
      --color-text-muted: #68645C;
      --color-cinnabar: #C84A3B;
      --color-moss: #537B65;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: var(--font-body); }
    button, a { font: inherit; }
    :focus-visible { outline: 1px solid var(--color-hairline-strong); outline-offset: 4px; border-radius: 2px; }

    /* Paste the complete contents of viewport-base.css here. */

    .slide-inner {
      position: relative;
      width: 100%;
      height: 100%;
      padding: var(--stage-padding-y) var(--stage-padding-x);
    }

    .eyebrow {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      font-size: 15px;
      line-height: 24px;
      letter-spacing: 0.08em;
      font-weight: 500;
      color: var(--color-cinnabar);
    }

    .display {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 92px;
      line-height: 1.25;
      letter-spacing: 0;
      color: var(--color-text);
    }

    .reveal {
      opacity: 0;
      transform: translateY(20px);
      transition:
        opacity var(--duration-normal) var(--ease-paper),
        transform var(--duration-normal) var(--ease-paper);
    }

    .visible .reveal { opacity: 1; transform: translateY(0); }
    .visible .reveal:nth-child(2) { transition-delay: 90ms; }
    .visible .reveal:nth-child(3) { transition-delay: 160ms; }
    .visible .reveal:nth-child(4) { transition-delay: 230ms; }

    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity: 1; transform: none; transition: none; }
    }
  </style>
</head>
<body>
  <div class="deck-viewport" aria-label="Presentation">
    <main class="deck-stage" id="deckStage">
      <section class="slide active visible" aria-label="Title slide">
        <div class="slide-inner">
          <p class="eyebrow reveal">Presentation / 01</p>
          <h1 class="display reveal">A strong thesis<br>needs a strong form.</h1>
          <p class="reveal">A concise supporting statement.</p>
        </div>
      </section>

      <section class="slide" aria-label="Content slide">
        <div class="slide-inner">
          <!-- Build this slide from a deliberate layout archetype. -->
        </div>
      </section>
    </main>
  </div>

  <nav class="deck-controls" aria-label="Presentation controls">
    <button type="button" id="prevBtn" aria-label="Previous slide">←</button>
    <span id="progress" aria-live="polite">1 / 2</span>
    <button type="button" id="nextBtn" aria-label="Next slide">→</button>
  </nav>

  <script>
    class SlidePresentation {
      constructor() {
        this.slides = [...document.querySelectorAll('.slide')];
        this.currentSlide = 0;
        this.stage = document.getElementById('deckStage');
        this.progress = document.getElementById('progress');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.touchStartX = 0;
        this.setupStageScale();
        this.setupKeyboardNav();
        this.setupTouchNav();
        this.setupControls();
        this.showSlide(0);
      }

      setupStageScale() {
        const scale = () => {
          const factor = Math.min(
            window.innerWidth / 1920,
            window.innerHeight / 1080
          );
          const x = (window.innerWidth - 1920 * factor) / 2;
          const y = (window.innerHeight - 1080 * factor) / 2;
          this.stage.style.transform = `translate(${x}px, ${y}px) scale(${factor})`;
        };
        scale();
        window.addEventListener('resize', scale, { passive: true });
      }

      setupKeyboardNav() {
        window.addEventListener('keydown', (event) => {
          const target = event.target;
          if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

          if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
            event.preventDefault();
            this.showSlide(this.currentSlide + 1);
          }
          if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
            event.preventDefault();
            this.showSlide(this.currentSlide - 1);
          }
          if (event.key === 'Home') this.showSlide(0);
          if (event.key === 'End') this.showSlide(this.slides.length - 1);
        });
      }

      setupTouchNav() {
        this.stage.addEventListener('touchstart', (event) => {
          this.touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        this.stage.addEventListener('touchend', (event) => {
          const delta = event.changedTouches[0].clientX - this.touchStartX;
          if (Math.abs(delta) > 50) {
            this.showSlide(this.currentSlide + (delta < 0 ? 1 : -1));
          }
        }, { passive: true });
      }

      setupControls() {
        this.prevBtn?.addEventListener('click', () => this.showSlide(this.currentSlide - 1));
        this.nextBtn?.addEventListener('click', () => this.showSlide(this.currentSlide + 1));
      }

      showSlide(index) {
        this.currentSlide = Math.max(0, Math.min(index, this.slides.length - 1));
        this.slides.forEach((slide, i) => {
          const active = i === this.currentSlide;
          slide.classList.toggle('active', active);
          slide.classList.toggle('visible', active);
        });
        this.progress.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
        if (this.prevBtn) this.prevBtn.disabled = this.currentSlide === 0;
        if (this.nextBtn) this.nextBtn.disabled = this.currentSlide === this.slides.length - 1;
      }
    }

    new SlidePresentation();
  </script>
</body>
</html>
```

## Architecture Rules

### Stage

- Use the exact 1920×1080 stage from `viewport-base.css`.
- Never put content outside the stage and hope responsive CSS repairs it.
- Keep layout coordinates explicit and stable.

### Slide switching

Use `.active` / `.visible` plus `visibility`, `opacity`, and `pointer-events`. Do not use `display` to switch slide visibility.

### Component grammar

Create repeated primitives only after the visual system is established: title block, utility label, rule, metric, callout, annotation, image frame, chart, footer, section marker, etc. Their spacing and type should derive from the token system.

### Semantics & accessibility

Use semantic sectioning, meaningful `aria-label`s for navigation, visible keyboard focus, descriptive image `alt` text, and a live progress indicator.

## Interaction Requirements

Every deck should support:

- ArrowLeft / ArrowUp: previous
- ArrowRight / ArrowDown / Space: next
- PageUp / PageDown
- Home / End
- touch/swipe where practical
- visible previous/next controls for non-keyboard users

Do not trap focus in decorative elements. Avoid hover-only critical interactions.

## Inline Editing

After the first draft, add editing affordances unless the user asks for a locked deck. Reveal controls through JavaScript with a small hover/focus grace period. Persist edits to localStorage and provide an explicit save/export action.

The presentation itself should remain visually clean; editing chrome should not become part of the slide design.

## Image Handling

Process large local images before embedding when practical. Preserve originals. Use deliberate crop/mask/frame choices. Never allow image borders, captions, or focal subjects to collide with nearby content.

## Performance

Prefer CSS animations using `transform` and `opacity`. Use `will-change` sparingly. Avoid expensive continuous pointer handlers unless the effect materially improves the design.

## Verification

Before considering the template implementation complete:

- inspect at 1920×1080
- inspect at 1280×720
- inspect at a phone viewport
- confirm exactly one slide is visible
- check text bounding boxes
- check visual overlap, especially grids and absolutely positioned panels
- verify keyboard and touch navigation
- verify reduced-motion behavior
- verify focus states
