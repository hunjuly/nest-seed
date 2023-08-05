FROM node:lts-alpine

RUN apk update

# Development Tools
RUN apk add -f git curl jq tree vim asciinema

# ApacheBench
RUN apk add -f apache2-utils

# Bash Install
RUN apk add -f bash bash-doc bash-completion
## default shell ash -> bash
RUN sed -i "s|/bin/ash|/bin/bash|g" /etc/passwd
## color prompt
RUN echo 'PS1="\[\033[32m\]\w\[\033[00m\] "' >> ~/.bashrc
RUN echo "alias ls='ls --color=auto'" >> ~/.bashrc
RUN echo "alias l='ls --color=auto -lA'" >> ~/.bashrc

# docker
RUN apk add -f docker-cli docker-cli-compose
# RUN apk add docker-cli-buildx
