# SVARA Farms — physical device checklist

Not yet run on physical devices. Automated tests use Chrome, Firefox and Playwright
WebKit (desktop and iPhone-sized emulation), which do not replace real phones.

Test on **iPhone Safari** (a recent iOS) and **Android Chrome** (a mid-range
phone), on Wi-Fi and on a throttled or real mobile connection.

| Area                  | Check                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| First load            | Hero photo appears promptly; no blank frame; header and logo centred                             |
| Images on mobile data | Leaf, pouch and journey photos show a soft preview, never an empty or broken frame               |
| Touch navigation      | Menu opens and closes; links tap first time; Escape/back closes the menu                         |
| Touch targets         | Menu, cart, quantity buttons, size options and journey leaflets are easy to hit (≥44px)          |
| Scroll                | Smooth scrolling through the homepage; no jumps when the header hides and returns                |
| Floating leaf         | Leaf stays within its frame; labels readable; no stutter while scrolling                         |
| Journey               | Vertical pathway readable; each stage image, number, title and text in order                     |
| Product               | Pouch label readable at phone width; nothing cropped; gallery thumbnails switch images           |
| Cart                  | Add to cart, change quantity, remove, close; count in header updates; checkout shown as disabled |
| Reduced motion        | With "Reduce Motion" (iOS) / "Remove animations" (Android) on, everything is visible and still   |
| Text size             | With larger system text, nothing overlaps or clips                                               |
| Orientation           | Rotating to landscape does not break the header or product layout                                |
