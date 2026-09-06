# HTML Presentation Template

Reference architecture for fixed-stage HTML presentations. Author every slide at 1920×1080 and scale the whole stage to the viewport.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation</title>
  <style>
    :root {
      --bg-primary: #0a0f1c;
      --text-primary: #fff;
      --text-secondary: #9ca3af;
      --accent: #00ffcc;
      --font-display: 'Clash Display', sans-serif;
      --font-body: 'Satoshi', sans-serif;
      --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
      --duration-normal: 0.6s;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Paste the complete contents of viewport-base.css here. */

    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity var(--duration-normal) var(--ease-out-expo),
                  transform var(--duration-normal) var(--ease-out-expo);
    }
    .slide.visible .reveal {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="deck-viewport">
    <main class="deck-stage" id="deckStage">
      <section class="slide title-slide active visible">
        <h1 class="reveal">Presentation Title</h1>
        <p class="reveal">Subtitle or author</p>
      </section>
      <section class="slide">
        <h2 class="reveal">Slide Title</h2>
        <p class="reveal">Content...</p>
      </section>
    </main>
  </div>

  <script>
    class SlidePresentation {
      constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.currentSlide = 0;
        this.stage = document.getElementById('deckStage');
        this.setupStageScale();
        this.setupKeyboardNav();
        this.setupTouchNav();
        this.showSlide(0);
      }

      setupStageScale() {
        const scale = () => {
          const factor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
          const x = (window.innerWidth - 1920 * factor) / 2;
          const y = (window.innerHeight - 1080 * factor) / 2;
          this.stage.style.transform = `translate(${x}px, ${y}px) scale(${factor})`;
        };
        scale();
        window.addEventListener('resize', scale);
      }

      setupKeyboardNav() {
        window.addEventListener('keydown', (e) => {
          if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') this.showSlide(this.currentSlide + 1);
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.showSlide(this.currentSlide - 1);
        });
      }

      setupTouchNav() {
        let startX = 0;
        this.stage.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, {passive: true});
        this.stage.addEventListener('touchend', e => {
          const delta = e.changedTouches[0].clientX - startX;
          if (Math.abs(delta) > 50) this.showSlide(this.currentSlide + (delta < 0 ? 1 : -1));
        }, {passive: true});
      }

      showSlide(index) {
        this.currentSlide = Math.max(0, Math.min(index, this.slides.length - 1));
        this.slides.forEach((slide, i) => {
          const active = i === this.currentSlide;
          slide.classList.toggle('active', active);
          slide.classList.toggle('visible', active);
        });
      }
    }

    new SlidePresentation();
  </script>
</body>
</html>
```

## Required Features

Every generated presentation should provide keyboard navigation, stage scaling, touch or swipe navigation where practical, reduced-motion support, and an optional progress indicator outside the slide stage.

Inline editing should be included after the first draft unless the user requests a locked deck. Reveal the edit control through JavaScript with a short hover grace period rather than a fragile CSS sibling-hover chain. Autosave edits to localStorage and provide an export/save action.

## Image Handling

When images are provided, process them before generation when needed. Preserve originals. Circular crops and max-dimension resizing can be implemented with Pillow. Place images using local file paths and keep them inside the 1920×1080 stage.

## Accessibility & Quality

Use semantic HTML, ARIA labels for controls, keyboard navigation, meaningful alt text, and `prefers-reduced-motion`. Add comments explaining each implementation section and keep the final file self-contained.
