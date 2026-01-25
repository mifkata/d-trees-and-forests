FROM python:3.11

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    inotify-tools \
    postgresql-client \
    sudo \
    unzip \
    wget \
    zsh \
    netcat-openbsd \
    vim \
    gh \
    jq \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create dev user with zsh as default shell and explicit home directory
RUN useradd -m -d /home/dev -s /bin/zsh dev \
    && chown -R dev:dev /home/dev \
    && echo "dev ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install Python dependencies as root (system-wide)
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Switch to dev user
USER dev
WORKDIR /home/dev

# Install oh-my-zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Install nvm, Node.js 22, and set as default
ENV NVM_DIR=/home/dev/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install 22 \
    && nvm alias default 22 \
    && nvm use default

# Add nvm to zshrc
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc \
    && echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc

# Install claude-code globally
RUN . $NVM_DIR/nvm.sh && npm install -g @anthropic-ai/claude-code

WORKDIR /app

CMD ["zsh"]
