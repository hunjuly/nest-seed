FROM node:lts-bullseye

RUN apt-get update

# Bash 설치 및 기본 셸 설정
RUN apt-get install -y bash bash-completion
# 기본 셸을 bash로 설정 (Ubuntu에서는 기본적으로 bash가 기본 셸임)
# 색상 있는 프롬프트 설정
RUN echo 'PS1="\[\033[32m\]\w\[\033[00m\] "' >> ~/.bashrc
RUN echo "alias ls='ls --color=auto'" >> ~/.bashrc
RUN echo "alias l='ls --color=auto -lA'" >> ~/.bashrc

# Docker 설치
RUN apt-get install -y docker.io docker-compose
# Docker CLI Buildx 설치 (필요한 경우)
# RUN apt-get install -y docker-cli-buildx

# 개발 도구 설치
RUN apt-get install -y git curl jq tree vim postgresql

# 포트 3000 노출
EXPOSE 3000
