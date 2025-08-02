FROM ubuntu:22.04

# Evită prompturile interactive
ENV DEBIAN_FRONTEND=noninteractive

# Update și instalare dependențe de bază
RUN apt-get update && apt-get install -y \
    software-properties-common \
    wget \
    curl \
    python3 \
    python3-pip \
    xvfb \
    calibre \
    poppler-utils \
    imagemagick \
    ghostscript \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

# Configurare ImageMagick pentru PDF processing
RUN sed -i '/disable ghostscript format types/,+6d' /etc/ImageMagick-6/policy.xml && \
    sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml

# Instalare pachete Python suplimentare pentru Calibre
RUN pip3 install --no-cache-dir \
    beautifulsoup4 \
    lxml \
    pillow \
    reportlab \
    python-dateutil \
    cssselect \
    mechanize \
    feedparser

# Creează directoare pentru storage
RUN mkdir -p /storage/input /storage/output /storage/temp

# Setează variabile de mediu pentru Calibre
ENV CALIBRE_WORKER_TEMP_DIR=/storage/temp
ENV CALIBRE_CONFIG_DIRECTORY=/storage/config

# Creează un script pentru conversia optimizată
COPY convert-optimized.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/convert-optimized.sh

# Creează configurații default pentru Calibre
RUN mkdir -p /storage/config && \
    echo "[DEFAULT]" > /storage/config/conversion.ini && \
    echo "input_profile = default" >> /storage/config/conversion.ini && \
    echo "output_profile = tablet" >> /storage/config/conversion.ini

# Script pentru verificarea health
COPY health-check.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/health-check.sh

# Setează working directory
WORKDIR /storage

# Health check pentru container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /usr/local/bin/health-check.sh

# Expune directorul storage ca volum
VOLUME ["/storage"]

# Comandă default
CMD ["tail", "-f", "/dev/null"]
