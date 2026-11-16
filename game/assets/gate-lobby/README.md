# Approved gate lobby

Source: `design-delivery/v2/05-mockups/gate-lobby-v1.png` (941 × 1672).
The source is copied byte-for-byte as `reference.png`. `scene.png` uses original
pixels for every static UI element; six character silhouettes are removable.
Only the area underneath those silhouettes uses the generated clean plate.
Character PNGs retain the original source pixels, with binary polygon masks.
The masks include a narrow courtyard margin; these are lobby cutouts, not
96 × 96 combat animation assets. Do not use them for battle frames.

`game/gate-lobby.js` maps real buttons and stored values to source coordinates.
Existing save data, roster ownership and progression are not changed. Six heroes
have source art; all other heroes keep their existing sprite/placeholder.
The mockup's Shu banners and red shortcut ornaments are static illustration,
not live faction/notification indicators. Level, XP, portrait, wallet, party and
campaign are live. Variable text uses runtime fonts and is not guaranteed to
match the generated lettering. Other screens and classic art mode keep their
existing rendering.

Rebuild from repository root:

```sh
npm ci --prefix design-delivery/v1/a-production/tools
node game/tools/build-gate-lobby.cjs
node game/tests/run-browser.cjs gate-lobby
```

The extraction tool asserts lossless reconstruction of the entire source.
The browser test uses an isolated profile with the mockup's six heroes and
example amounts. It compares 1,558,212 rendered pixels at native size, excluding
the live lord portrait and XP field, and requires zero changed pixels. It also
checks real party reordering, changing amounts, dialogs, tabs, battle entry and
360/390/1440px viewport layouts. Screenshots and metrics: `test-artifacts/gate-lobby/`.

Momentary press feedback is implemented in `game/gate-press.js`. It shades only
the clipped interior of each original button, with no translation or resizing.
The normal artwork is untouched. Native click events still own all actions;
touch releases outside the button are canceled. Pointer cancellation, keyboard,
blur, visibility, resizing and navigation clear the feedback. Browser checks
assert no changed pixels outside the pressed settings button and byte-identical
screen restoration on release, plus real touch and keyboard activation.
