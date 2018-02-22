FROM node:9.4 as build
MAINTAINER Omid Hezaveh <Omid.Hezaveh@futurice.com>

WORKDIR /app

# Install app dependencies
COPY . ./

# install dependencies, Build and optimize the react app
RUN npm install && npm run build && npm install pm2 -g

# two step build idea from https://learnk8s.io/blog/smaller-docker-images
FROM node:8-alpine
COPY --from=build /app /
EXPOSE 8000
CMD [ "pm2-runtime", "server.js" ]

