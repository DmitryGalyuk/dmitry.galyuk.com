# Design System: Editorial Health & Wellness (2024-2026)



## 1. Overview & Creative North Star

**Creative North Star: "The Digital Sanctuary"**

This design system moves away from the clinical, cold aesthetics often found in health tech. Instead, it embraces an editorial, high-end lifestyle approach. It is built on the philosophy of **Soft Minimalism**—where trust is earned through breathing room, organic shapes, and a palette inspired by the natural world.



To break the "template" look, we utilize **Intentional Asymmetry**. Rather than perfectly centered blocks, we favor offset text alignments and overlapping "floating" containers. This creates a rhythmic, human quality that reflects the systemic, non-linear nature of health and biology.



---



## 2. Colors: Tonal Depth & Eco-Aesthetics

The palette is a sophisticated blend of sage, terracotta, and warm neutrals. It is designed to soothe the user while maintaining high professional authority.



* **Primary (`#56642b`):** Deep Sage. Used for moments of growth and core actions.

* **Secondary (`#924a28`):** Earthy Terracotta. Reserved for warmth, vitality, and highlighting "Systemic" results.

* **Surface Hierarchy:**

* `surface` (`#faf9f5`): The "Paper" base. Warm and inviting.

* `surface-container-low` (`#f4f4f0`): Used for large structural background shifts.

* `surface-container-highest` (`#e3e2df`): Used for cards and interactive Bento modules to create lift.



### The "No-Line" Rule

**Explicit Instruction:** Do not use 1px solid borders to define sections. Boundaries must be defined solely by background color shifts or tonal transitions. Use `surface-container-low` sections against a `surface` background to denote change.



### The Glass & Gradient Rule

For the 2024-2026 modernization, use **Glassmorphism** for floating action buttons or navigation bars.

* **Backdrop Blur:** 12px to 20px.

* **Fill:** `surface` at 70% opacity.

* **Signature Textures:** Apply a subtle radial gradient transitioning from `primary` to `primary_container` on Hero CTA buttons to add "soul" and depth.



---



## 3. Typography: Editorial Authority

We use a high-contrast typography scale to create an editorial feel, pairing the structural elegance of **Manrope** with the modern readability of **Plus Jakarta Sans**.



* **Display & Headlines (Manrope):** Large, bold, and authoritative. These are the "voice" of Dmitry Galyuk.

* *Scale Example:* `display-lg` (3.5rem) should be used for core systemic health statements, utilizing tight letter-spacing (-0.02em).

* **Body & Titles (Plus Jakarta Sans):** Modern and friendly.

* *Usage:* Use `body-lg` (1rem) for consultations and advice to ensure maximum legibility for health-conscious users.

* **Labels (Plus Jakarta Sans):** Used for the Bento grid categories (e.g., "Energy," "Skin," "Detox") in `label-md` uppercase with slight tracking (+0.05em).



---



## 4. Elevation & Depth: Tonal Layering

Traditional shadows are replaced by **Tonal Layering**. We achieve hierarchy by "stacking" the surface-container tiers.



* **The Layering Principle:** Place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f4f4f0) background. This creates a natural "lift" mimicking fine stationery.

* **Ambient Shadows:** If a floating effect is required (e.g., a modal or top-tier card), use a shadow with a blur of 40px and 4% opacity, tinted with `on_surface` (#1b1c1a).

* **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.



---



## 5. Components: Bespoke Implementation



### The Bento Grid (Results & Cases)

Instead of a standard list, use a Bento-style grid with varying aspect ratios.

* **Styling:** Use `xl` (1.5rem) rounded corners.

* **Background:** Use `surface_container_highest`.

* **Interaction:** On hover, the container should shift slightly to `surface_container_lowest` to simulate a tactile press.



### Buttons (Signature CTAs)

* **Primary:** Fill with `primary` (#56642b), text in `on_primary` (#ffffff). Shape: `full` (pill-shaped).

* **Secondary:** No fill. Use a "Ghost Border" (15% opacity `outline`) with `secondary` text.

* **States:** Hover states should involve a subtle shift in color density rather than a shadow increase.



### Chips (Modernized Filtering)

As seen in the legacy UI, but updated:

* **Inactive:** `surface_container_high` background with `on_surface_variant` text.

* **Active:** `primary` background with `on_primary` text.

* **Corner Radius:** `md` (0.75rem) to maintain a soft, friendly vibe.



### Inputs & Fields

* **Visual Style:** Forgo the bottom line or heavy box. Use a subtle `surface_container_low` background with a `sm` (0.25rem) corner radius.

* **Labels:** Always persistent in `label-md` to maintain clarity.



---



## 6. Do's and Don'ts



### Do:

* **Do** use extreme white space (Spacers `16` and `20`) between major systemic sections to let the content breathe.

* **Do** utilize organic, soft-cropped imagery (rounded corners `xl`) for "Before & After" results to maintain a friendly, professional vibe.

* **Do** prioritize a mobile-first, thumb-friendly layout with pill-shaped interactive elements.



### Don't:

* **Don't** use 1px solid black or high-contrast borders; it breaks the "Eco-Aesthetic" sanctuary feel.

* **Don't** use pure black (#000000) for text. Always use `on_surface` (#1b1c1a) to maintain a soft, premium appearance.

* **Don't** use standard "drop shadows." If it doesn't look like ambient natural light, remove it.

* **Don't** use dividers/lines to separate list items. Use spacing (Scale `3` or `4`) to define the separation.