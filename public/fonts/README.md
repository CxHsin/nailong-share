# Typography sources

The website uses self-hosted Charter for Latin text and Source Han Serif SC for
Chinese text, including navigation, titles, body text, and the brand wordmark.
Code keeps its monospace stack; mathematical notation uses KaTeX fonts.

- Charter: regular, bold, italic, and bold italic WOFF2 files from
  https://github.com/chawyehsu/charter-webfont, converted from Bitstream Charter.
  Redistribution notice: LICENSE-Charter.txt.
- Source Han Serif SC: official variable WOFF2 (250-900) from
  https://github.com/adobe-fonts/source-han-serif/tree/release/Variable/WOFF2/TTF.
  SIL Open Font License: LICENSE-Source-Han-Serif.txt.

Both families use font-display: swap. Charter precedes Source Han Serif in the
font stack so Latin glyphs use Charter and Chinese glyphs use Source Han Serif.
