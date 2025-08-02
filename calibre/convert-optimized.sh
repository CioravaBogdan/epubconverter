#!/bin/bash

# Script optimizat pentru conversia cărților de copii PDF → EPUB/MOBI
# Folosește parametri specifici pentru păstrarea calității imaginilor

set -e

# Funcție pentru logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Verifică parametrii
if [ $# -lt 2 ]; then
    echo "Usage: $0 <input.pdf> <output.epub|mobi> [options]"
    echo "Options:"
    echo "  --title 'Title'"
    echo "  --author 'Author'"
    echo "  --optimize kindle|ipad|generic"
    echo "  --cover extract|none"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"
shift 2

# Parse argumentele opționale
TITLE=""
AUTHOR=""
OPTIMIZE="generic"
COVER="extract"

while [[ $# -gt 0 ]]; do
    case $1 in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --author)
            AUTHOR="$2"
            shift 2
            ;;
        --optimize)
            OPTIMIZE="$2"
            shift 2
            ;;
        --cover)
            COVER="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log "Starting conversion: $INPUT_FILE → $OUTPUT_FILE"
log "Parameters: optimize=$OPTIMIZE, cover=$COVER"

# Verifică dacă fișierul de intrare există
if [ ! -f "$INPUT_FILE" ]; then
    log "ERROR: Input file not found: $INPUT_FILE"
    exit 1
fi

# Determină formatul de ieșire
OUTPUT_FORMAT=$(echo "$OUTPUT_FILE" | rev | cut -d. -f1 | rev | tr '[:upper:]' '[:lower:]')

# Construiește comanda Calibre
CALIBRE_CMD=(
    "ebook-convert"
    "$INPUT_FILE"
    "$OUTPUT_FILE"
)

# Parametri comuni pentru toate formatele
COMMON_ARGS=(
    "--preserve-cover-aspect-ratio"
    "--embed-all-fonts"
    "--disable-font-rescaling"
    "--minimum-line-height" "130"
    "--margin-left" "5"
    "--margin-right" "5"
    "--margin-top" "5"
    "--margin-bottom" "5"
    "--dont-compress"
    "--no-grayscale"
    "--jpeg-quality" "100"
    "--rescale-images"
    "--keep-aspect-ratio"
    "--verbose"
)

# Determină profilul de output
case $OPTIMIZE in
    kindle)
        OUTPUT_PROFILE="kindle_pw3"
        ;;
    ipad)
        OUTPUT_PROFILE="ipad3"
        ;;
    generic|*)
        OUTPUT_PROFILE="tablet"
        ;;
esac

# Parametri specifici pentru EPUB
if [ "$OUTPUT_FORMAT" = "epub" ]; then
    EPUB_ARGS=(
        "--output-profile" "$OUTPUT_PROFILE"
        "--epub-version" "3"
        "--flow-size" "0"
        "--no-default-epub-cover"
        "--expand-css"
        "--smarten-punctuation"
        "--epub-flatten"
        "--epub-toc-at-end"
        "--max-toc-links" "0"
        "--chapter" "//h:h1 | //h:h2"
        "--page-breaks-before" "//h:h1"
    )
    CALIBRE_CMD+=("${EPUB_ARGS[@]}")
fi

# Parametri specifici pentru MOBI
if [ "$OUTPUT_FORMAT" = "mobi" ]; then
    MOBI_ARGS=(
        "--output-profile" "kindle_pw3"
        "--mobi-file-type" "both"
        "--mobi-ignore-margins"
        "--share-not-sync"
        "--mobi-keep-original-images"
        "--mobi-toc-at-start"
        "--personal-doc" "[PDOC]"
    )
    CALIBRE_CMD+=("${MOBI_ARGS[@]}")
fi

# Adaugă parametrii comuni
CALIBRE_CMD+=("${COMMON_ARGS[@]}")

# Adaugă metadata dacă e specificată
if [ -n "$TITLE" ]; then
    CALIBRE_CMD+=("--title" "$TITLE")
fi

if [ -n "$AUTHOR" ]; then
    CALIBRE_CMD+=("--authors" "$AUTHOR")
fi

# Gestionare cover
case $COVER in
    extract)
        CALIBRE_CMD+=("--preserve-cover-aspect-ratio")
        ;;
    none)
        CALIBRE_CMD+=("--no-default-epub-cover")
        ;;
esac

# Extrage informații despre PDF înainte de conversie
log "Extracting PDF info..."
pdfinfo "$INPUT_FILE" 2>/dev/null | head -20 || log "Warning: Could not extract PDF info"

# Rulează conversia
log "Running Calibre conversion..."
log "Command: ${CALIBRE_CMD[*]}"

# Setează timeout de 10 minute
timeout 600 "${CALIBRE_CMD[@]}" 2>&1 | while IFS= read -r line; do
    log "CALIBRE: $line"
done

# Verifică dacă conversia a reușit
if [ ${PIPESTATUS[0]} -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "unknown")
    log "SUCCESS: Conversion completed. Output file size: $FILE_SIZE bytes"
    
    # Informații suplimentare despre fișierul rezultat
    if command -v file >/dev/null 2>&1; then
        FILE_TYPE=$(file "$OUTPUT_FILE" 2>/dev/null || echo "unknown")
        log "File type: $FILE_TYPE"
    fi
    
    exit 0
else
    log "ERROR: Conversion failed or output file not created"
    exit 1
fi
