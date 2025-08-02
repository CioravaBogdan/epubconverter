#!/bin/bash

# Health check script pentru container Calibre

set -e

# Verifică dacă Calibre este instalat și funcțional
if ! command -v calibre >/dev/null 2>&1; then
    echo "ERROR: Calibre not found"
    exit 1
fi

# Verifică versiunea Calibre
CALIBRE_VERSION=$(calibre --version 2>/dev/null | head -1)
if [ -z "$CALIBRE_VERSION" ]; then
    echo "ERROR: Cannot get Calibre version"
    exit 1
fi

# Verifică ebook-convert
if ! command -v ebook-convert >/dev/null 2>&1; then
    echo "ERROR: ebook-convert not found"
    exit 1
fi

# Verifică utilitarele PDF
if ! command -v pdfinfo >/dev/null 2>&1; then
    echo "WARNING: pdfinfo not found"
fi

if ! command -v pdftoppm >/dev/null 2>&1; then
    echo "WARNING: pdftoppm not found"
fi

# Verifică directoarele storage
for dir in "/storage/input" "/storage/output" "/storage/temp"; do
    if [ ! -d "$dir" ]; then
        echo "ERROR: Storage directory not found: $dir"
        exit 1
    fi
    
    if [ ! -w "$dir" ]; then
        echo "ERROR: Storage directory not writable: $dir"
        exit 1
    fi
done

# Test rapid de conversie (doar dacă există un fișier de test)
if [ -f "/storage/test.pdf" ]; then
    echo "Running conversion test..."
    if timeout 30 ebook-convert /storage/test.pdf /storage/temp/test.epub --verbose >/dev/null 2>&1; then
        rm -f /storage/temp/test.epub
        echo "Conversion test successful"
    else
        echo "WARNING: Conversion test failed"
    fi
fi

# Verifică spațiul disponibil
AVAILABLE_SPACE=$(df /storage | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then  # Mai puțin de 1GB
    echo "WARNING: Low disk space: ${AVAILABLE_SPACE}KB available"
fi

echo "OK: Calibre health check passed - $CALIBRE_VERSION"
exit 0
