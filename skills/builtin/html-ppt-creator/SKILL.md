---
name: html-ppt-creator
description: Build high-quality HTML presentations with the App module in `<AgentWorkspaceRoot>/app`, suitable for pitches, reports, and presentations. Help users converge on a style quickly by showing visual directions first and iterating on content afterward.
---

# Frontend Slides Skill

Create animation-rich HTML presentations using the **App module** (Vite + TypeScript + React) in **`<AgentWorkspaceRoot>/app`**. This skill helps non-designers discover their preferred aesthetic through visual exploration ("show, don't tell"), then generates production-quality slide decks as a React application.

## Core Philosophy

1. **App module workflow** — Use `<AgentWorkspaceRoot>/app` to build presentation pages as a Vite + React project, run `pnpm build`, and preview with the `BuildAndRefreshApp` tool.
2. **Show, Don't Tell** — People don't know what they want until they see it. Generate visual previews, not abstract choices.
3. **Distinctive Design** — Avoid generic "AI slop" aesthetics. Every presentation should feel custom-crafted.
4. **Production Quality** — Code should be well-commented, accessible, and performant.
5. **Viewport Fitting (CRITICAL)** — Every slide MUST fit exactly within the viewport. No scrolling within slides, ever. This is non-negotiable.

---

## CRITICAL: Viewport Fitting Requirements

**This section is mandatory for ALL presentations. Every slide must be fully visible without scrolling on any screen size.**

### The Golden Rule

```
Each slide = exactly one viewport height (100vh/100dvh)
Content overflows? → Split into multiple slides or reduce content
Never scroll within a slide.
```

### Content Density Limits

To guarantee viewport fitting, enforce these limits per slide:

| Slide Type    | Maximum Content                                           |
| ------------- | --------------------------------------------------------- |
| Title slide   | 1 heading + 1 subtitle + optional tagline                 |
| Content slide | 1 heading + 4-6 bullet points OR 1 heading + 2 paragraphs |
| Feature grid  | 1 heading + 6 cards maximum (2x3 or 3x2 grid)             |
| Code slide    | 1 heading + 8-10 lines of code maximum                    |
| Quote slide   | 1 quote (max 3 lines) + attribution                       |
| Image slide   | 1 heading + 1 image (max 60vh height)                     |

**If content exceeds these limits → Split into multiple slides**

### Required CSS Architecture

Every presentation MUST include this base CSS for viewport fitting:

```css
/* ===========================================
   VIEWPORT FITTING: MANDATORY BASE STYLES
   These styles MUST be included in every presentation.
   They ensure slides fit exactly in the viewport.
   =========================================== */

/* 1. Lock html/body to viewport */
html, body {
    height: 100%;
    overflow-x: hidden;
}

html {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
}

/* 2. Each slide = exact viewport height */
.slide {
    width: 100vw;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile browsers */
    overflow: hidden; /* CRITICAL: Prevent ANY overflow */
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* 3. Content container with flex for centering */
.slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-height: 100%;
    overflow: hidden; /* Double-protection against overflow */
    padding: var(--slide-padding);
}

/* 4. ALL typography uses clamp() for responsive scaling */
:root {
    /* Titles scale from mobile to desktop */
    --title-size: clamp(1.5rem, 5vw, 4rem);
    --h2-size: clamp(1.25rem, 3.5vw, 2.5rem);
    --h3-size: clamp(1rem, 2.5vw, 1.75rem);

    /* Body text */
    --body-size: clamp(0.75rem, 1.5vw, 1.125rem);
    --small-size: clamp(0.65rem, 1vw, 0.875rem);

    /* Spacing scales with viewport */
    --slide-padding: clamp(1rem, 4vw, 4rem);
    --content-gap: clamp(0.5rem, 2vw, 2rem);
    --element-gap: clamp(0.25rem, 1vw, 1rem);
}

/* 5. Cards/containers use viewport-relative max sizes */
.card, .container, .content-box {
    max-width: min(90vw, 1000px);
    max-height: min(80vh, 700px);
}

/* 6. Lists auto-scale with viewport */
.feature-list, .bullet-list {
    gap: clamp(0.4rem, 1vh, 1rem);
}

.feature-list li, .bullet-list li {
    font-size: var(--body-size);
    line-height: 1.4;
}

/* 7. Grids adapt to available space */
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: clamp(0.5rem, 1.5vw, 1rem);
}

/* 8. Images constrained to viewport */
img, .image-container {
    max-width: 100%;
    max-height: min(50vh, 400px);
    object-fit: contain;
}

/* ===========================================
   RESPONSIVE BREAKPOINTS
   Aggressive scaling for smaller viewports
   =========================================== */

/* Short viewports (< 700px height) */
@media (max-height: 700px) {
    :root {
        --slide-padding: clamp(0.75rem, 3vw, 2rem);
        --content-gap: clamp(0.4rem, 1.5vw, 1rem);
        --title-size: clamp(1.25rem, 4.5vw, 2.5rem);
        --h2-size: clamp(1rem, 3vw, 1.75rem);
    }
}

/* Very short viewports (< 600px height) */
@media (max-height: 600px) {
    :root {
        --slide-padding: clamp(0.5rem, 2.5vw, 1.5rem);
        --content-gap: clamp(0.3rem, 1vw, 0.75rem);
        --title-size: clamp(1.1rem, 4vw, 2rem);
        --body-size: clamp(0.7rem, 1.2vw, 0.95rem);
    }

    /* Hide non-essential elements */
    .nav-dots, .keyboard-hint, .decorative {
        display: none;
    }
}

/* Extremely short (landscape phones, < 500px height) */
@media (max-height: 500px) {
    :root {
        --slide-padding: clamp(0.4rem, 2vw, 1rem);
        --title-size: clamp(1rem, 3.5vw, 1.5rem);
        --h2-size: clamp(0.9rem, 2.5vw, 1.25rem);
        --body-size: clamp(0.65rem, 1vw, 0.85rem);
    }
}

/* Narrow viewports (< 600px width) */
@media (max-width: 600px) {
    :root {
        --title-size: clamp(1.25rem, 7vw, 2.5rem);
    }

    /* Stack grids vertically */
    .grid {
        grid-template-columns: 1fr;
    }
}

/* ===========================================
   REDUCED MOTION
   Respect user preferences
   =========================================== */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.2s !important;
    }

    html {
        scroll-behavior: auto;
    }
}
```

### Overflow Prevention Checklist

Before generating any presentation, mentally verify:

1. ✅ Every `.slide` has `height: 100vh; height: 100dvh; overflow: hidden;`
2. ✅ All font sizes use `clamp(min, preferred, max)`
3. ✅ All spacing uses `clamp()` or viewport units
4. ✅ Content containers have `max-height` constraints
5. ✅ Images have `max-height: min(50vh, 400px)` or similar
6. ✅ Grids use `auto-fit` with `minmax()` for responsive columns
7. ✅ Breakpoints exist for heights: 700px, 600px, 500px
8. ✅ No fixed pixel heights on content elements
9. ✅ Content per slide respects density limits

### When Content Doesn't Fit

If you find yourself with too much content:

**DO:**
- Split into multiple slides
- Reduce bullet points (max 5-6 per slide)
- Shorten text (aim for 1-2 lines per bullet)
- Use smaller code snippets
- Create a "continued" slide
- **When adding images to existing slides:** Move image to new slide or reduce other content first

**DON'T:**
- Reduce font size below readable limits
- Remove padding/spacing entirely
- Allow any scrolling
- Cram content to fit
- Add images without checking if existing content already fills the viewport

### Testing Viewport Fit

After generating, recommend the user test at these sizes:
- Desktop: 1920×1080, 1440×900, 1280×720
- Tablet: 1024×768, 768×1024 (portrait)
- Mobile: 375×667, 414×896
- Landscape phone: 667×375, 896×414

---

## Phase 0: Detect Mode

First, determine what the user wants:

**Mode A: New Presentation**
- User wants to create slides from scratch
- Proceed to Phase 1 (Content Discovery)

**Mode B: Existing Presentation Enhancement**
- User has an existing presentation app and wants to improve it
- Read the existing `app/src/` files, understand the structure, then enhance
- **CRITICAL: When modifying existing slides, ALWAYS ensure viewport fitting is maintained**

### Mode B: Critical Modification Rules

When enhancing existing presentations, follow these mandatory rules:

**1. Before Adding Any Content:**
- Read the current slide structure and count existing elements
- Check against content density limits (see table above)
- Calculate if the new content will fit within viewport constraints

**2. When Adding Images (MOST COMMON ISSUE):**
- Images must have `max-height: min(50vh, 400px)` or similar viewport constraint
- Check if current slide already has maximum content (1 heading + 1 image)
- If adding an image to a slide with existing content → **Split into two slides**
- Example: If slide has heading + 4 bullets, and user wants to add an image:
  - **DON'T:** Cram image onto same slide
  - **DO:** Create new slide with heading + image, keep bullets on original slide
  - **OR:** Reduce bullets to 2-3 and add image with proper constraints

**3. When Adding Text Content:**
- Max 4-6 bullet points per slide
- Max 2 paragraphs per slide
- If adding content exceeds limits → **Split into multiple slides or create a continuation slide**

**4. Required Checks After ANY Modification:**
```
✅ Does the slide have `overflow: hidden` on `.slide` class?
✅ Are all new elements using `clamp()` for font sizes?
✅ Do new images have viewport-relative max-height?
✅ Does total content respect density limits?
✅ Will this fit on a 1280×720 screen? On mobile portrait?
```

**5. Proactive Reorganization (NOT Optional):**
When you detect that modifications will cause overflow:
- **Automatically split content across slides** — Don't wait for user to ask
- Inform user: "I've reorganized the content across 2 slides to ensure proper viewport fitting"
- Use "continued" pattern for split content (e.g., "Key Features" → "Key Features (Continued)")

**6. Testing After Modifications:**
Mentally verify the modified slide at these viewport sizes:
- Desktop: 1280×720 (smallest common)
- Tablet portrait: 768×1024
- Mobile: 375×667

**If in doubt → Split the content. Never allow scrolling within a slide.**

---

## Phase 1: Content Discovery (New Presentations)

Before designing, understand the content. Ask via AskUserQuestion:

### Step 1.1: Presentation Context + Images (Single Form)

**IMPORTANT:** Ask ALL 4 questions in a single AskUserQuestion call so the user can fill everything out at once before submitting.

**Question 1: Purpose**
- Header: "Purpose"
- Question: "What is this presentation for?"
- Options:
  - "Pitch deck" — Selling an idea, product, or company to investors/clients
  - "Teaching/Tutorial" — Explaining concepts, how-to guides, educational content
  - "Conference talk" — Speaking at an event, tech talk, keynote
  - "Internal presentation" — Team updates, strategy meetings, company updates

**Question 2: Slide Count**
- Header: "Length"
- Question: "Approximately how many slides?"
- Options:
  - "Short (5-10)" — Quick pitch, lightning talk
  - "Medium (10-20)" — Standard presentation
  - "Long (20+)" — Deep dive, comprehensive talk

**Question 3: Content**
- Header: "Content"
- Question: "Do you have the content ready, or do you need help structuring it?"
- Options:
  - "I have all content ready" — Just need to design the presentation
  - "I have rough notes" — Need help organizing into slides
  - "I have a topic only" — Need help creating the full outline

**Question 4: Images**
- Header: "Images"
- Question: "Do you have images to include? Select 'No images' or select Other and type/paste your image folder path."
- Options:
  - "No images" — Text-only presentation (use CSS-generated visuals instead)
  - "./assets" — Use the `assets/` folder in the current project

The user can select **"Other"** to type or paste any custom folder path (e.g. `~/Desktop/screenshots`). This way the image folder path is collected in the same form — no extra round-trip.

If user has content, ask them to share it (text, bullet points, images, etc.).

### Step 1.2: Image Evaluation

**User-provided assets are important visual anchors** — but not every asset is necessarily usable. The first step is always to evaluate. After evaluation, the curated assets become additional context that shapes how the presentation is built. This is a **co-design process**: text content + curated visuals together inform the slide structure from the start, not a post-hoc "fit images in after the fact."

**If user selected "No images"** → Skip the entire image pipeline. Proceed directly to Phase 2 (Automatic Style Selection) and Phase 3 (Generate Presentation) using text content only. The presentation will use CSS-generated visuals (gradients, shapes, patterns, typography) for visual interest — this is the original behavior and produces fully polished results without any images.

**If user provides an image folder:**

1. **Scan the folder** — Use `ls` to list all image files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`)
2. **View each image** — Use the Read tool to see what each image contains (Claude is multimodal)
3. **Evaluate each image** — For each image, assess:
   - Filename and dimensions
   - What it shows (screenshot, logo, chart, diagram, photo)
   - **Usability:** Is the image clear, relevant to the presentation topic, and high enough quality? Mark as `USABLE` or `NOT USABLE` (with reason: blurry, irrelevant, broken, etc.)
   - **Content signal:** What feature or concept does this image represent? (e.g., "chat_ui.png" → "conversational interface feature")
   - Shape: square, landscape, portrait, circular
   - Dominant colors (important for style compatibility later)
4. **Present the evaluation and proposed slide outline to the user** — Show which images are usable and which are not, with reasons. Then show the proposed slide outline with image assignments.

**Co-design: curated assets inform the outline**

After evaluation, the **usable** images become context for planning the slide structure alongside text content. This is not "plan slides then add images" — it's designing the presentation around both text and visuals from the start:

- 3 usable product screenshots → plan 3 feature slides, each anchored by one screenshot
- 1 usable logo → title slide and/or closing slide
- 1 usable architecture diagram → dedicated "How It Works" slide
- 1 blurry/irrelevant image → excluded, with explanation to user

This means curated images are factored in **before** style selection (Phase 2) and **before** code generation (Phase 3). They are co-equal context in the design process.

5. **Confirm outline via AskUserQuestion** — Do NOT break the flow by asking the user to type free text. Use AskUserQuestion to confirm:

**Question: Outline Confirmation**
- Header: "Outline"
- Question: "Does this slide outline and image selection look right?"
- Options:
  - "Looks good, proceed" — Move on to generation
  - "Adjust images" — I want to change which images go where
  - "Adjust outline" — I want to change the slide structure

This keeps the entire flow in the AskUserQuestion format without dropping to free-text chat.

---

## Phase 2: Automatic Style Selection

**No user interaction needed.** The skill automatically selects the best style preset based on context gathered in Phase 1.

### Available Presets

| Preset            | Vibe                      | Best For              |
| ----------------- | ------------------------- | --------------------- |
| Bold Signal       | Confident, high-impact    | Pitch decks, keynotes |
| Electric Studio   | Clean, professional       | Agency presentations  |
| Creative Voltage  | Energetic, retro-modern   | Creative pitches      |
| Dark Botanical    | Elegant, sophisticated    | Premium brands        |
| Notebook Tabs     | Editorial, organized      | Reports, reviews      |
| Pastel Geometry   | Friendly, approachable    | Product overviews     |
| Split Pastel      | Playful, modern           | Creative agencies     |
| Vintage Editorial | Witty, personality-driven | Personal brands       |
| Neon Cyber        | Futuristic, techy         | Tech startups         |
| Terminal Green    | Developer-focused         | Dev tools, APIs       |
| Swiss Modern      | Minimal, precise          | Corporate, data       |
| Paper & Ink       | Literary, thoughtful      | Storytelling          |

### Selection Logic

Analyze the user's input from Phase 1 — purpose, topic, content tone, and image colors (if any) — and pick the single best-matching preset. Use these heuristics:

| Signal                                       | Recommended Preset(s)             |
| -------------------------------------------- | --------------------------------- |
| Pitch deck / investor audience               | Bold Signal, Electric Studio      |
| Tech product / API / developer tools         | Neon Cyber, Terminal Green        |
| Educational / tutorial / how-to              | Notebook Tabs, Swiss Modern       |
| Creative agency / design portfolio           | Creative Voltage, Split Pastel    |
| Premium brand / luxury / lifestyle           | Dark Botanical, Vintage Editorial |
| Product overview / feature walkthrough       | Pastel Geometry, Electric Studio  |
| Internal meeting / corporate update          | Swiss Modern, Notebook Tabs       |
| Storytelling / narrative / personal          | Paper & Ink, Vintage Editorial    |
| User explicitly requests a style by name     | Use the requested preset directly |
| Image palette is warm (gold/terracotta/pink) | Dark Botanical, Vintage Editorial |
| Image palette is cool (blue/cyan/green)      | Neon Cyber, Electric Studio       |
| Image palette is pastel / light              | Pastel Geometry, Split Pastel     |

**Override:** If the user explicitly mentions a style name or a clear aesthetic preference (e.g., "dark and techy", "clean and minimal"), that takes priority over the heuristic.

After selecting a preset, briefly tell the user which style was chosen and why, then proceed directly to Phase 3. Example:

> I chose the **Bold Signal** style for this pitch deck: a high-contrast dark background with bold accent cards, which works well for confident, high-impact investor-facing storytelling.

**IMPORTANT: Never use these generic patterns:**
- Purple gradients on white backgrounds
- Inter, Roboto, or system fonts
- Standard blue primary colors
- Predictable hero layouts

**Instead, use distinctive choices:**
- Unique font pairings (Clash Display, Satoshi, Cormorant Garamond, DM Sans, etc.)
- Cohesive color themes with personality
- Atmospheric backgrounds (gradients, subtle patterns, depth)
- Signature animation moments

---

## Phase 3: Generate Presentation

Now generate the full presentation as a React app based on:
- Content from Phase 1 (text only, or text + curated images)
- Style auto-selected in Phase 2

If the user provided images, the slide outline already incorporates them as visual anchors from Step 1.2. If not, proceed with text-only content — CSS-generated visuals (gradients, shapes, patterns) provide visual interest.

### Image Pipeline (skip if no images)

If the user chose "No images" in Step 1.2, **skip this entire section** and go straight to generating React code. The presentation will use CSS-generated visuals — this is a fully supported, first-class path.

If the user provided images, execute these steps **before** generating the React code.

**Key principle: Co-design, not post-hoc.** The curated images from Step 1.2 (those marked `USABLE`) are already part of the slide outline. The pipeline's job here is to process images for the chosen style and place them in the app.

#### Step 3.1: Image Processing (Pillow)

For each curated image, determine what processing it needs based on the chosen style (e.g., circular crop for logos, resize for large files) and what CSS framing will bridge any color gaps between the image and the style's palette. Then process accordingly.

**Rules:**
- **Never repeat** the same image on multiple slides (except logos which may bookend title + closing)
- **Always add CSS framing** (border, glow, shadow) for images whose colors clash with the style's palette

**Dependency:** Python `Pillow` library (the standard image processing library for Python).

```bash
# Install if not available (portable across macOS/Linux/Windows)
pip install Pillow
```

A standard, well-maintained Python package that any user can install.

**Common processing operations:**

```python
from PIL import Image, ImageDraw

# ─── Circular Crop (for logos on modern/clean styles) ───
def crop_circle(input_path, output_path):
    """Crop a square image to a circle with transparent background."""
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    # Make square if not already
    size = min(w, h)
    left = (w - size) // 2
    top = (h - size) // 2
    img = img.crop((left, top, left + size, top + size))
    # Create circular mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)
    img.putalpha(mask)
    img.save(output_path, 'PNG')

# ─── Resize (for oversized images that inflate the HTML) ───
def resize_max(input_path, output_path, max_dim=1200):
    """Resize image so largest dimension <= max_dim. Preserves aspect ratio."""
    img = Image.open(input_path)
    img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    img.save(output_path, quality=85)

# ─── Add Padding / Background (for images that need breathing room) ───
def add_padding(input_path, output_path, padding=40, bg_color=(0, 0, 0, 0)):
    """Add transparent padding around an image."""
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    new = Image.new('RGBA', (w + 2*padding, h + 2*padding), bg_color)
    new.paste(img, (padding, padding), img)
    new.save(output_path, 'PNG')
```

**When to apply each operation:**

| Situation                                       | Operation                                               |
| ----------------------------------------------- | ------------------------------------------------------- |
| Square logo on a style with rounded aesthetics  | `crop_circle()`                                         |
| Image > 1MB (slow to load)                      | `resize_max(max_dim=1200)`                              |
| Screenshot needs breathing room in layout       | `add_padding()`                                         |
| Image has wrong aspect ratio for its slide slot | Manual crop with `img.crop((left, top, right, bottom))` |

**Save processed images** to `app/public/images/` with descriptive names (e.g., `logo_round.png`). Never overwrite the user's original files.

#### Step 3.2: Place Images

Place processed images in `app/public/images/` and reference them in React components:

```tsx
<img src="/images/logo_round.png" alt="Logo" className="slide-image logo" />
<img src="/images/screenshot.png" alt="Screenshot" className="slide-image screenshot" />
```

Vite will resolve `/images/...` paths from the `public/` directory. In the built single-file output, `vite-plugin-singlefile` will inline these assets.

**Image CSS classes (adapt border/glow colors to match the chosen style):**
```css
/* Base image constraint — CRITICAL for viewport fitting */
.slide-image {
    max-width: 100%;
    max-height: min(50vh, 400px);
    object-fit: contain;
    border-radius: 8px;
}

.slide-image.screenshot {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.slide-image.logo {
    max-height: min(30vh, 200px);
}
```

**Placement patterns:**
- **Title slide:** Logo centered above or beside the title
- **Feature slides:** Screenshot on one side, text on the other (two-column layout)
- **Full-bleed:** Image as slide background with text overlay (use with caution)
- **Inline:** Image within content flow, centered, with caption below

### File Structure

The presentation app follows the standard app module structure:

```
app/
├── app.json             # Set the app name to the presentation title
├── package.json
├── index.html           # Entry HTML, including font CDN links
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── public/
│   └── images/          # Image assets, if any
└── src/
    ├── main.tsx          # React entry point
    ├── App.tsx           # Main app: slide container + navigation logic
    ├── index.css         # Global styles: theme variables + viewport fitting + animations
    ├── slides.tsx        # All slide components
    └── vite-env.d.ts
```

**Important:** Update the `name` field in `app/app.json` to the presentation title.

### React Architecture

#### `app/index.html`

This entry HTML file is responsible for loading font CDNs:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presentation Title</title>
    <!-- Fonts (use Fontshare or Google Fonts) -->
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=..." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### `app/src/App.tsx`

This is the main application component, responsible for the slide container and navigation controls:

```tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { slides } from './slides'
import './index.css'

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleSlides, setVisibleSlides] = useState<Set<number>>(new Set([0]))
  const containerRef = useRef<HTMLDivElement>(null)

  const totalSlides = slides.length

  const scrollToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, totalSlides - 1))
    const el = document.getElementById(`slide-${clamped}`)
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [totalSlides])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-index'))
          setVisibleSlides((prev) => {
            const next = new Set(prev)
            if (entry.isIntersecting) {
              next.add(idx)
              setCurrentSlide(idx)
            }
            return next
          })
        })
      },
      { threshold: 0.5 }
    )

    document.querySelectorAll('.slide').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        scrollToSlide(currentSlide + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollToSlide(currentSlide - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, scrollToSlide])

  return (
    <>
      {/* Progress bar */}
      <div
        className="progress-bar"
        style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
      />

      {/* Navigation dots */}
      <nav className="nav-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === currentSlide ? 'active' : ''}`}
            onClick={() => scrollToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </nav>

      {/* Slides */}
      <div ref={containerRef}>
        {slides.map((SlideComponent, i) => (
          <section
            key={i}
            id={`slide-${i}`}
            className={`slide ${visibleSlides.has(i) ? 'visible' : ''}`}
            data-index={i}
          >
            <SlideComponent />
          </section>
        ))}
      </div>
    </>
  )
}
```

#### `app/src/slides.tsx`

Define all slide content in this file. Each slide is a function component:

```tsx
import type { FC } from 'react'

const TitleSlide: FC = () => (
  <div className="slide-content title-slide">
    <h1 className="reveal">Presentation Title</h1>
    <p className="reveal">Subtitle or tagline</p>
  </div>
)

const ContentSlide: FC = () => (
  <div className="slide-content">
    <h2 className="reveal">Slide Title</h2>
    <ul className="bullet-list">
      <li className="reveal">Point one</li>
      <li className="reveal">Point two</li>
      <li className="reveal">Point three</li>
    </ul>
  </div>
)

const FeatureGridSlide: FC = () => (
  <div className="slide-content">
    <h2 className="reveal">Features</h2>
    <div className="grid">
      <div className="card reveal">Feature 1</div>
      <div className="card reveal">Feature 2</div>
      <div className="card reveal">Feature 3</div>
    </div>
  </div>
)

// Export all slides as an ordered array
export const slides: FC[] = [
  TitleSlide,
  ContentSlide,
  FeatureGridSlide,
  // ... more slides
]
```

#### `app/src/index.css`

This global stylesheet includes:

1. **CSS custom properties (theme)**: colors, fonts, spacing, and animation values
2. **Mandatory viewport-fitting styles**: see "Required CSS Architecture" above
3. **Animation classes**: the `.reveal` entrance animation
4. **Progress bar and navigation dots**: UI control styling
5. **Responsive breakpoints**: height and width adaptation

```css
/* ===========================================
   CSS CUSTOM PROPERTIES (THEME)
   Easy to modify: change these to change the whole look
   =========================================== */
:root {
    /* Colors */
    --bg-primary: #0a0f1c;
    --bg-secondary: #111827;
    --text-primary: #ffffff;
    --text-secondary: #9ca3af;
    --accent: #00ffcc;
    --accent-glow: rgba(0, 255, 204, 0.3);

    /* Typography - MUST use clamp() for responsive scaling */
    --font-display: 'Clash Display', sans-serif;
    --font-body: 'Satoshi', sans-serif;
    --title-size: clamp(2rem, 6vw, 5rem);
    --subtitle-size: clamp(0.875rem, 2vw, 1.25rem);
    --body-size: clamp(0.75rem, 1.2vw, 1rem);

    /* Spacing - MUST use clamp() for responsive scaling */
    --slide-padding: clamp(1.5rem, 4vw, 4rem);
    --content-gap: clamp(1rem, 2vw, 2rem);

    /* Animation */
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --duration-normal: 0.6s;
}

/* ===========================================
   BASE STYLES
   =========================================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
    scroll-snap-type: y mandatory;
    height: 100%;
}

body {
    font-family: var(--font-body);
    background: var(--bg-primary);
    color: var(--text-primary);
    overflow-x: hidden;
    height: 100%;
}

/* ===========================================
   SLIDE CONTAINER
   CRITICAL: Each slide MUST fit exactly in viewport
   =========================================== */
.slide {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-height: 100%;
    overflow: hidden;
    padding: var(--slide-padding);
}

/* ===========================================
   PROGRESS BAR
   =========================================== */
.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--accent);
    transition: width 0.3s var(--ease-out-expo);
    z-index: 1000;
}

/* ===========================================
   NAVIGATION DOTS
   =========================================== */
.nav-dots {
    position: fixed;
    right: clamp(0.5rem, 2vw, 1.5rem);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--text-secondary);
    background: transparent;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
}

.dot.active {
    background: var(--accent);
    border-color: var(--accent);
    transform: scale(1.3);
}

/* ===========================================
   ANIMATIONS
   Trigger via .visible class on parent .slide
   =========================================== */
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

/* Stagger children */
.reveal:nth-child(1) { transition-delay: 0.1s; }
.reveal:nth-child(2) { transition-delay: 0.2s; }
.reveal:nth-child(3) { transition-delay: 0.3s; }
.reveal:nth-child(4) { transition-delay: 0.4s; }
.reveal:nth-child(5) { transition-delay: 0.5s; }
.reveal:nth-child(6) { transition-delay: 0.6s; }

/* ===========================================
   RESPONSIVE BREAKPOINTS
   =========================================== */
@media (max-height: 600px) {
    :root {
        --slide-padding: clamp(1rem, 3vw, 2rem);
        --content-gap: clamp(0.5rem, 1.5vw, 1rem);
    }
}

@media (max-width: 768px) {
    :root {
        --title-size: clamp(1.5rem, 8vw, 3rem);
    }
}

@media (max-height: 500px) and (orientation: landscape) {
    :root {
        --title-size: clamp(1.25rem, 5vw, 2rem);
        --slide-padding: clamp(0.75rem, 2vw, 1.5rem);
    }
}

@media (prefers-reduced-motion: reduce) {
    .reveal {
        transition: opacity 0.3s ease;
        transform: none;
    }
}

/* ... more preset-specific styles ... */
```

### Optional Enhancements (based on style)

These React patterns can be added as needed:

- **Custom cursor with trail** — a `<CustomCursor />` component using `onMouseMove`
- **Particle system background** — a `<ParticleCanvas />` component with `useRef` + canvas
- **Parallax effects** — CSS `transform` driven by scroll position
- **3D tilt on hover** — event handlers on card components
- **Counter animations** — `useEffect` + `requestAnimationFrame`

### Code Quality Requirements

**Comments:**
Every major section in CSS and complex logic in TSX should have clear comments explaining:
- What it does
- Why it exists
- How to modify it

**Accessibility:**
- Semantic HTML (`<section>`, `<nav>`, `<main>`)
- Keyboard navigation works (arrows, space)
- ARIA labels on navigation elements
- Reduced motion support

**CSS Function Negation:**
- Never negate CSS functions directly — `-clamp()`, `-min()`, `-max()` are silently ignored by browsers with no console error
- Always use `calc(-1 * clamp(...))` instead. See STYLE_PRESETS.md → "CSS Gotchas" for details.

**Responsive & Viewport Fitting (CRITICAL):**

**See the "CRITICAL: Viewport Fitting Requirements" section above for complete CSS and guidelines.**

Quick reference:
- Every `.slide` must have `height: 100vh; height: 100dvh; overflow: hidden;`
- All typography and spacing must use `clamp()`
- Respect content density limits (max 4-6 bullets, max 6 cards, etc.)
- Include breakpoints for heights: 700px, 600px, 500px
- When content doesn't fit → split into multiple slides, never scroll

---

## Phase 4: Delivery

### Build and Preview

When the presentation code is complete:

1. **Update `app.json`** — Set `name` to the presentation title
2. **Install dependencies** — Run `pnpm install` in the `app/` directory (if new dependencies were added)
3. **Build** — Run `pnpm build` in the `app/` directory
4. **Refresh preview** — Call `BuildAndRefreshApp` tool to refresh the app module preview
5. **Switch to app module** — Call `SwitchModule` with `module: "app"` to show the preview

### Provide Summary

```
Your presentation is ready!

📁 Project: [project name]
🎨 Style: [Style Name]
📊 Slides: [count]

**Navigation:**
- Arrow keys (← →) or Space to navigate
- Scroll/swipe also works
- Click the dots on the right to jump to a slide

**To customize:**
- Colors: Modify CSS custom properties in `app/src/index.css` `:root`
- Fonts: Change the font CDN link in `app/index.html`
- Content: Edit slide components in `app/src/slides.tsx`
- Animations: Modify `.reveal` class timings in `app/src/index.css`

Would you like me to make any adjustments?
```

---

## Style Reference: Effect → Feeling Mapping

Use this guide to match animations to intended feelings:

### Dramatic / Cinematic
- Slow fade-ins (1-1.5s)
- Large scale transitions (0.9 → 1)
- Dark backgrounds with spotlight effects
- Parallax scrolling
- Full-bleed images

### Techy / Futuristic
- Neon glow effects (box-shadow with accent color)
- Particle systems (canvas background)
- Grid patterns
- Monospace fonts for accents
- Glitch or scramble text effects
- Cyan, magenta, electric blue palette

### Playful / Friendly
- Bouncy easing (spring physics)
- Rounded corners (large radius)
- Pastel or bright colors
- Floating/bobbing animations
- Hand-drawn or illustrated elements

### Professional / Corporate
- Subtle, fast animations (200-300ms)
- Clean sans-serif fonts
- Navy, slate, or charcoal backgrounds
- Precise spacing and alignment
- Minimal decorative elements
- Data visualization focus

### Calm / Minimal
- Very slow, subtle motion
- High whitespace
- Muted color palette
- Serif typography
- Generous padding
- Content-focused, no distractions

### Editorial / Magazine
- Strong typography hierarchy
- Pull quotes and callouts
- Image-text interplay
- Grid-breaking layouts
- Serif headlines, sans-serif body
- Black and white with one accent

---

## Animation Patterns Reference

### Entrance Animations (CSS)

```css
/* Fade + Slide Up (most common) */
.reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s var(--ease-out-expo),
                transform 0.6s var(--ease-out-expo);
}

.visible .reveal {
    opacity: 1;
    transform: translateY(0);
}

/* Scale In */
.reveal-scale {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

/* Slide from Left */
.reveal-left {
    opacity: 0;
    transform: translateX(-50px);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

/* Blur In */
.reveal-blur {
    opacity: 0;
    filter: blur(10px);
    transition: opacity 0.8s, filter 0.8s var(--ease-out-expo);
}
```

### Background Effects (CSS)

```css
/* Gradient Mesh */
.gradient-bg {
    background:
        radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(0, 255, 200, 0.2) 0%, transparent 50%),
        var(--bg-primary);
}

/* Noise Texture */
.noise-bg {
    background-image: url("data:image/svg+xml,..."); /* Inline SVG noise */
}

/* Grid Pattern */
.grid-bg {
    background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
}
```

### Interactive Effects (React Component Pattern)

```tsx
import { useRef, useCallback } from 'react'

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)'
    }
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.3s ease' }}
    >
      {children}
    </div>
  )
}
```

---

## Troubleshooting

### Common Issues

**Fonts not loading:**
- Check the CDN link in `app/index.html` `<head>`
- Ensure font names match in CSS `--font-display` / `--font-body` variables

**Animations not triggering:**
- Verify IntersectionObserver in `App.tsx` is running
- Check that `.visible` class is being added to parent `.slide` elements

**Scroll snap not working:**
- Ensure `scroll-snap-type: y mandatory` on `html`
- Each `.slide` needs `scroll-snap-align: start`

**Build fails:**
- Run `pnpm install` first to ensure dependencies are installed
- Check for TypeScript errors in slide components

**Images not showing:**
- Ensure images are in `app/public/images/` (not `app/src/`)
- Use absolute paths from root: `/images/filename.png`

**Mobile issues:**
- Disable heavy effects at 768px breakpoint
- Reduce particle count or disable canvas components
- Verify touch scroll works with snap points

**Performance issues:**
- Use `will-change` sparingly
- Prefer CSS `transform` and `opacity` for animations
- Memoize heavy components with `React.memo`
- Throttle scroll/mousemove handlers

---

## Related Skills

- **app-creator** — General app development skill for the app module
- **frontend-design** — For more complex interactive pages beyond slides

---

## Example Session Flow

1. User: "I want to create a pitch deck for my AI startup"
2. Skill asks about purpose, length, content, and images (single form)
3. User shares bullet points, selects `./assets` folder
4. **Evaluate:** Skill views each image (multimodal), builds slide outline with image assignments:
   - `logo.png` → USABLE → title/closing slide
   - `chat_ui.png` → USABLE → feature slide
   - `dashboard.png` → USABLE → feature slide
   - `launch_card.png` → USABLE → feature slide
   - `blurry_team.jpg` → NOT USABLE (too low resolution)
5. User confirms outline via AskUserQuestion
6. **Auto style:** Skill analyzes context (pitch deck + AI startup + cool-toned screenshots) → selects **Neon Cyber** preset, tells user the choice
7. **Process + Generate:** Skill runs Pillow operations (circular crop, resize), copies images to `app/public/images/`, generates full React slide components
8. Skill runs `pnpm build` → calls `BuildAndRefreshApp` to show the presentation
9. User requests tweaks to specific slides
10. Skill modifies `slides.tsx` / `index.css` → rebuilds → refreshes
11. Final presentation delivered
