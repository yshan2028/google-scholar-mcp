FROM python:3.10-slim

WORKDIR /app

# 复制依赖文件
COPY pyproject.toml ./
COPY uv.lock ./
COPY README.md ./
COPY google_scholar_server_api.py ./

# 安装 Python 依赖
RUN pip install --no-cache-dir uv && \
    uv pip install --system --no-cache-dir -e . && \
    pip uninstall -y uv

# 设置入口点
ENTRYPOINT ["google-scholar-mcp"]
