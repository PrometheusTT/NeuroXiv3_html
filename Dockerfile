# 使用官方的 Node.js 镜像作为基础镜像
FROM neuroxiv_html:v2.0

# 设置工作目录
WORKDIR /neuroxiv_html

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

RUN npm config set registry https://registry.npm.taobao.org/

# 安装项目依赖
RUN npm install

# 安装Puppeteer依赖的库
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libpango-1.0-0 \
    libgbm-dev \
    libxss1

# 复制整个项目到工作目录
COPY . .

# 构建生产环境的Vue 3项目
#RUN npm run build

# 暴露容器的端口号（根据你的Vue项目配置确定）
EXPOSE 8081

# 启动应用
CMD ["npm", "run", "serve"]
