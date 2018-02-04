FROM node:9.4
MAINTAINER Omid Hezaveh <Omid.Hezaveh@futurice.com>


# Create app directory
RUN mkdir -p /src/app
WORKDIR /src/app

# to make npm test run only once non-interactively
ENV CI=true

# Install app dependencies
COPY package.json /src/app/
RUN npm install && \
    npm install pm2 -g

# Bundle app source
COPY . /src/app

# Build and optimize react app
RUN npm run build

EXPOSE 8000

# defined in package.json
CMD [ "pm2-runtime", "server.js" ]
