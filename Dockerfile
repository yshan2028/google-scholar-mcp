FROM python:3.13-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY pyproject.toml ./
COPY uv.lock ./
COPY README.md ./
COPY src/ ./src/

# 安装 Python 依赖
RUN pip install --no-cache-dir uv && \
    uv pip install --system --no-cache-dir -e . && \
    pip uninstall -y uv

# 设置入口点
ENTRYPOINT ["google-scholar-mcp"]
